import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { File, User, ActivityLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const UPLOAD_DIR = process.env.SMB_MOUNT_PATH 
  ? path.join(process.env.SMB_MOUNT_PATH, 'user_files')
  : process.env.LOCAL_STORAGE_PATH || './storage/user-files';

const ensureStorageDir = (userId) => {
  const userDir = path.join(UPLOAD_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

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

    const userDir = ensureStorageDir(req.userId);
    const fileId = uuidv4();
    const ext = path.extname(filename);
    const storagePath = path.join(userDir, `${fileId}${ext}`);

    await uploadedFile.mv(storagePath);
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(storagePath)).digest('hex');

    const file = await File.create({
      userId: req.userId,
      folderId: folderId || null,
      filename,
      storagePath,
      thumbnailPath: null,
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
    const { folderId } = req.query;
    const files = await File.findByUser(req.userId, folderId || null);
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
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
    await File.restore(req.params.id);
    res.json({ message: 'File restored' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
});

export default router;
