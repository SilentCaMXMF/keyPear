import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { File, User, ActivityLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { generateThumbnail, deleteThumbnail, getFileType, getFileIcon } from '../services/thumbnail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const getStoragePath = () => {
  const basePath = process.env.SMB_MOUNT_PATH 
    ? path.join(process.env.SMB_MOUNT_PATH, 'keypear_files')
    : path.join(__dirname, '../../storage/user-files');
  return path.resolve(basePath);
};

const ensureStorageDir = (userId) => {
  const userDir = path.join(getStoragePath(), userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

const sanitizeFilename = (filename) => {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .substring(0, 200);
};

const getFileMeta = (mimeType, filename) => ({
  fileType: getFileType(mimeType, filename),
  icon: getFileIcon(mimeType, filename),
});

router.post('/upload', authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId } = req.body;
    const uploadedFile = req.files.file;
    const originalFilename = sanitizeFilename(uploadedFile.name);
    const size = uploadedFile.size;
    const mimeType = uploadedFile.mimeType || 'application/octet-stream';

    const userDir = ensureStorageDir(req.userId);
    const fileId = uuidv4();
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    const storageFilename = `${baseName}_${fileId}${ext}`;
    const storagePath = path.join(userDir, storageFilename);

    await uploadedFile.mv(storagePath);
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(storagePath)).digest('hex');

    let thumbnailPath = null;
    try {
      thumbnailPath = await generateThumbnail(storagePath, fileId);
    } catch (thumbErr) {
      console.log('Thumbnail generation skipped:', thumbErr.message);
    }

    const file = await File.create({
      userId: req.userId,
      folderId: folderId || null,
      filename: originalFilename,
      storagePath,
      thumbnailPath,
      size,
      mimeType,
      checksum,
    });

    await User.updateStorageUsed(req.userId, size);
    await ActivityLog.create({ userId: req.userId, action: 'file_upload', fileId: file.id, metadata: { filename: originalFilename, size } });

    res.status(201).json({ 
      file: {
        ...file,
        ...getFileMeta(mimeType, originalFilename),
        hasThumbnail: !!thumbnailPath,
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { folderId, search, sort = 'created_at', order = 'DESC' } = req.query;
    
    let files;
    if (search) {
      files = await File.search(req.userId, search, folderId || null);
    } else {
      files = await File.findByUser(req.userId, folderId || null, sort, order);
    }
    
    const filesWithMeta = files.map(f => ({
      ...f,
      ...getFileMeta(f.mime_type, f.filename),
      hasThumbnail: !!f.thumbnail_path,
    }));

    const user = await User.findById(req.userId);

    res.json({ 
      files: filesWithMeta,
      storage: {
        used: user.storage_used || 0,
        quota: user.storage_quota || 10 * 1024 * 1024 * 1024,
      }
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, folderId } = req.body;
    const file = await File.findById(req.params.id);

    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (name !== undefined) {
      const ext = path.extname(file.filename);
      const baseName = path.basename(file.filename, ext);
      const oldPath = file.storage_path;
      const newFilename = sanitizeFilename(name + ext);
      const newPath = path.join(path.dirname(oldPath), `${newFilename}_${file.id}${ext}`);
      
      fs.renameSync(oldPath, newPath);
      await File.update(file.id, { filename: newFilename, storagePath: newPath });
      
      if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
        const newThumbPath = path.join(path.dirname(file.thumbnail_path), `${file.id}.jpg`);
        fs.renameSync(file.thumbnail_path, newThumbPath);
        await File.update(file.id, { thumbnailPath: newThumbPath });
      }
      
      await ActivityLog.create({ userId: req.userId, action: 'file_rename', fileId: file.id, metadata: { oldName: file.filename, newName: newFilename } });
      
      return res.json({ id: file.id, filename: newFilename });
    }

    if (folderId !== undefined) {
      await File.update(file.id, { folderId: folderId || null });
      await ActivityLog.create({ userId: req.userId, action: 'file_move', fileId: file.id, metadata: { folderId } });
      return res.json({ id: file.id, folder_id: folderId || null });
    }

    res.status(400).json({ error: 'No valid update fields provided' });
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

router.post('/:id/copy', authenticate, async (req, res) => {
  try {
    const { folderId } = req.body;
    const originalFile = await File.findById(req.params.id);

    if (!originalFile || originalFile.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(originalFile.storage_path)) {
      return res.status(404).json({ error: 'Original file not found on disk' });
    }

    const userDir = ensureStorageDir(req.userId);
    const fileId = uuidv4();
    const ext = path.extname(originalFile.filename);
    const baseName = path.basename(originalFile.filename, ext).replace(/_[^_]+$/, '');
    const newFilename = `${baseName}_copy_${fileId}${ext}`;
    const newPath = path.join(userDir, newFilename);

    fs.copyFileSync(originalFile.storage_path, newPath);
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(newPath)).digest('hex');

    let thumbnailPath = null;
    if (originalFile.thumbnail_path && fs.existsSync(originalFile.thumbnail_path)) {
      const newThumbPath = path.join(path.dirname(originalFile.thumbnail_path), `${fileId}.jpg`);
      fs.copyFileSync(originalFile.thumbnail_path, newThumbPath);
      thumbnailPath = newThumbPath;
    }

    const newFile = await File.create({
      userId: req.userId,
      folderId: folderId || originalFile.folder_id,
      filename: `${baseName}_copy${ext}`,
      storagePath: newPath,
      thumbnailPath,
      size: originalFile.size,
      mimeType: originalFile.mime_type,
      checksum,
    });

    await User.updateStorageUsed(req.userId, originalFile.size);
    await ActivityLog.create({ userId: req.userId, action: 'file_copy', fileId: newFile.id, metadata: { originalId: originalFile.id } });

    res.status(201).json({ 
      file: {
        ...newFile,
        ...getFileMeta(originalFile.mime_type, newFile.filename),
        hasThumbnail: !!thumbnailPath,
      }
    });
  } catch (error) {
    console.error('Copy file error:', error);
    res.status(500).json({ error: 'Failed to copy file' });
  }
});

router.post('/bulk-delete', authenticate, async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'No file IDs provided' });
    }

    let totalSize = 0;
    for (const fileId of fileIds) {
      const file = await File.findById(fileId);
      if (file && file.user_id === req.userId) {
        if (fs.existsSync(file.storage_path)) {
          fs.unlinkSync(file.storage_path);
        }
        if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
          fs.unlinkSync(file.thumbnail_path);
        }
        totalSize += file.size || 0;
        await File.delete(fileId);
      }
    }

    if (totalSize > 0) {
      await User.updateStorageUsed(req.userId, -totalSize);
    }

    await ActivityLog.create({ userId: req.userId, action: 'bulk_delete', metadata: { count: fileIds.length } });

    res.json({ message: `${fileIds.length} files deleted`, deleted: fileIds.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

router.get('/:id/thumbnail', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.thumbnail_path || !fs.existsSync(file.thumbnail_path)) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    const stream = fs.createReadStream(file.thumbnail_path);
    stream.pipe(res);
  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});

router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    const stream = fs.createReadStream(file.storage_path);
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { permanent } = req.query;
    const file = await File.findById(req.params.id);

    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (permanent === 'true') {
      if (fs.existsSync(file.storage_path)) {
        fs.unlinkSync(file.storage_path);
      }
      if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
        fs.unlinkSync(file.thumbnail_path);
      }
      await User.updateStorageUsed(req.userId, -file.size);
      await File.delete(req.params.id);
      return res.json({ message: 'File permanently deleted' });
    }

    await File.softDelete(req.params.id);
    res.json({ message: 'File moved to trash' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    await File.restore(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'file_restore', fileId: file.id, metadata: { filename: file.filename } });
    res.json({ message: 'File restored' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore file' });
  }
});

router.get('/trash', authenticate, async (req, res) => {
  try {
    const files = await File.findTrashed(req.userId);
    const filesWithMeta = files.map(f => ({
      ...f,
      ...getFileMeta(f.mime_type, f.filename),
      hasThumbnail: !!f.thumbnail_path,
    }));
    res.json({ files: filesWithMeta });
  } catch (error) {
    console.error('Trash error:', error);
    res.status(500).json({ error: 'Failed to list trash' });
  }
});

router.get('/recent', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const files = await File.findRecent(req.userId, limit);
    const filesWithMeta = files.map(f => ({
      ...f,
      ...getFileMeta(f.mime_type, f.filename),
      hasThumbnail: !!f.thumbnail_path,
    }));
    res.json({ files: filesWithMeta });
  } catch (error) {
    console.error('Recent error:', error);
    res.status(500).json({ error: 'Failed to list recent files' });
  }
});

export default router;
