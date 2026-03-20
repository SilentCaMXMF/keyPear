import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { dbWrapper } from '../services/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './storage';
const USER_STORAGE_FOLDER = 'user_files';
const STORAGE_BASE = LOCAL_STORAGE_PATH;

async function ensureStorageDir(userId: string): Promise<string> {
  const userDir = join(STORAGE_BASE, USER_STORAGE_FOLDER, userId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const path = req.query.path as string || '/';
    const userId = req.user!.id;
    
    const result = dbWrapper.query(
      `SELECT id, name, path, size, mimeType, isFolder, parentId, createdAt, updatedAt
       FROM files WHERE userId = ? AND path = ? ORDER BY isFolder DESC, name ASC`,
      [userId, path]
    );
    
    res.json(result.rows.map((f: any) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      size: f.size,
      mimeType: f.mimeType,
      type: f.isFolder ? 'folder' : 'file',
      parentId: f.parentId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })));
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    const userId = req.user!.id;
    const filePath = req.body.path || '/';
    const fileName = req.file.originalname;
    
    const userResult = dbWrapper.query('SELECT storageQuota, storageUsed FROM users WHERE id = ?', [userId]);
    const user = userResult.rows[0] as { storageQuota: number; storageUsed: number } | undefined;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.storageUsed + req.file.size > user.storageQuota) {
      return res.status(400).json({ message: 'Storage quota exceeded' });
    }
    
    const storageDir = await ensureStorageDir(userId);
    const fileId = uuidv4();
    const storedFileName = `${fileId}_${fileName}`;
    const fullPath = join(storageDir, storedFileName);
    
    await fs.writeFile(fullPath, req.file.buffer);
    
    let parentId = null;
    if (filePath !== '/') {
      const parentResult = dbWrapper.query(
        'SELECT id FROM files WHERE userId = ? AND path = ? AND name = ? AND isFolder = 1',
        [userId, filePath, basename(filePath)]
      );
      parentId = parentResult.rows[0]?.id || null;
    }
    
    dbWrapper.run(
      'INSERT INTO files (id, userId, name, path, size, mimeType, storagePath, isFolder, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
      [fileId, userId, fileName, filePath, req.file.size, req.file.mimetype, fullPath, parentId]
    );
    
    dbWrapper.run('UPDATE users SET storageUsed = storageUsed + ? WHERE id = ?', [req.file.size, userId]);
    
    dbWrapper.run(
      'INSERT INTO activityLog (id, userId, action, fileId, details) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, 'upload', fileId, JSON.stringify({ fileName, size: req.file.size })]
    );
    
    res.status(201).json({
      id: fileId,
      name: fileName,
      path: filePath,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: 'file',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/:id/download', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const fileId = req.params.id;
    const isShared = req.query.shared === 'true';
    const userId = req.user!.id;
    
    if (!isShared && !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let result;
    if (isShared) {
      result = dbWrapper.query('SELECT name, storagePath, mimeType, userId FROM files WHERE id = ?', [fileId]);
    } else {
      result = dbWrapper.query('SELECT name, storagePath, mimeType, userId FROM files WHERE id = ? AND userId = ?', [fileId, userId]);
    }
    
    const file = result.rows[0] as { name: string; storagePath: string; mimeType: string; userId: string } | undefined;
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.download(file.storagePath, file.name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;
    
    const result = dbWrapper.query(
      'SELECT id, name, path, size, storagePath, isFolder FROM files WHERE id = ? AND userId = ?',
      [fileId, userId]
    );
    const file = result.rows[0] as { id: string; name: string; path: string; size: number; storagePath: string; isFolder: number } | undefined;
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    if (file.isFolder === 0) {
      try {
        await fs.unlink(file.storagePath);
      } catch (err) {
        console.error('Failed to delete file from storage:', err);
      }
    }
    
    dbWrapper.run('DELETE FROM files WHERE id = ?', [fileId]);
    
    if (file.isFolder === 0) {
      dbWrapper.run('UPDATE users SET storageUsed = MAX(0, storageUsed - ?) WHERE id = ?', [file.size, userId]);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
