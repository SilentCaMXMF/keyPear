const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { File, User, Folder, ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const thumbnailService = require('../services/thumbnail');

const router = express.Router();
const UPLOAD_DIR = process.env.STORAGE_PATH || './storage/user-files';

router.post('/upload', authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folderId } = req.body;
    const uploadedFile = req.files.file;
    const filename = uploadedFile.name;
    const size = uploadedFile.size;
    const mimeType = uploadedFile.mimeType || 'application/octet-stream';

    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder || folder.user_id !== req.userId || folder.deleted_at) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    const user = await User.findById(req.userId);
    if (user.storage_used + size > user.storage_quota) {
      return res.status(507).json({ error: 'Storage quota exceeded' });
    }

    const userDir = path.join(UPLOAD_DIR, req.userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const ext = path.extname(filename);
    const storagePath = path.join(userDir, `${fileId}${ext}`);

    await uploadedFile.mv(storagePath);

    let thumbnailPath = null;
    if (mimeType && mimeType.startsWith('image/')) {
      thumbnailPath = await thumbnailService.generateThumbnail(storagePath, fileId);
    }

    const checksum = crypto.createHash('sha256').update(fs.readFileSync(storagePath)).digest('hex');

    const file = await File.create({
      userId: req.userId,
      folderId: folderId || null,
      filename,
      storagePath,
      thumbnailPath,
      size,
      mimeType,
      checksum,
    });

    await User.updateStorageUsed(req.userId, size);
    await ActivityLog.create({ userId: req.userId, action: 'file_upload', fileId: file.id, metadata: { filename, size } });

    res.status(201).json({ file });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { folderId, includeDeleted } = req.query;
    const files = await File.findByUser(req.userId, folderId || null, includeDeleted === 'true');
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId || file.deleted_at) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    await ActivityLog.create({ userId: req.userId, action: 'file_download', fileId: file.id, metadata: { filename: file.filename } });

    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.size);

    const stream = fs.createReadStream(file.storage_path);
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.get('/:id/thumbnail', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId || file.deleted_at) {
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
    res.status(500).json({ error: 'Thumbnail fetch failed' });
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
      await ActivityLog.create({ userId: req.userId, action: 'file_delete_permanent', fileId: file.id, metadata: { filename: file.filename } });
      await File.delete(req.params.id);
      return res.json({ message: 'File permanently deleted' });
    }

    await File.softDelete(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'file_delete', fileId: file.id, metadata: { filename: file.filename } });

    res.json({ message: 'File moved to trash' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.user_id !== req.userId || !file.deleted_at) {
      return res.status(404).json({ error: 'File not found in trash' });
    }

    await File.restore(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'file_restore', fileId: file.id, metadata: { filename: file.filename } });

    res.json({ message: 'File restored' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
});

module.exports = router;
