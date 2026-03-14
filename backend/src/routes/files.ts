import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { db } from '../services/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit

// Get storage path from env - prefer local storage, fallback to SMB mount
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/home/pedroocalado/keypear/storage';
const SMB_MOUNT_PATH = process.env.SMB_MOUNT_PATH || '/home/pedroocalado/keypear_mount';
const USER_STORAGE_FOLDER = 'user_files';

// Use local storage by default (SMB mount may be read-only)
const STORAGE_BASE = LOCAL_STORAGE_PATH;

// Ensure storage directory exists
async function ensureStorageDir(userId: string): Promise<string> {
  const userDir = join(STORAGE_BASE, USER_STORAGE_FOLDER, userId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

// Get files list
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const path = req.query.path as string || '/';
    const userId = req.user!.id;
    
    const files = db.prepare(`
      SELECT id, name, path, size, mimeType, isFolder, parentId, createdAt, updatedAt
      FROM files
      WHERE userId = ? AND path = ?
      ORDER BY isFolder DESC, name ASC
    `).all(userId, path) as Array<{
      id: string;
      name: string;
      path: string;
      size: number;
      mimeType: string | null;
      isFolder: number;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    
    res.json(files.map(f => ({
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

// Upload file
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    const userId = req.user!.id;
    const filePath = req.body.path || '/';
    const fileName = req.file.originalname;
    
    // Check storage quota
    const user = db.prepare('SELECT storageQuota, storageUsed FROM users WHERE id = ?').get(userId) as { storageQuota: number; storageUsed: number } | undefined;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.storageUsed + req.file.size > user.storageQuota) {
      return res.status(400).json({ message: 'Storage quota exceeded' });
    }
    
    // Save file to storage
    const storageDir = await ensureStorageDir(userId);
    const fileId = uuidv4();
    const storedFileName = `${fileId}_${fileName}`;
    const fullPath = join(storageDir, storedFileName);
    
    await fs.writeFile(fullPath, req.file.buffer);
    
    // Get parent folder ID if exists
    let parentId = null;
    if (filePath !== '/') {
      const parent = db.prepare('SELECT id FROM files WHERE userId = ? AND path = ? AND name = ? AND isFolder = 1')
        .get(userId, filePath, basename(filePath)) as { id: string } | undefined;
      parentId = parent?.id || null;
    }
    
    // Save to database
    db.prepare(`
      INSERT INTO files (id, userId, name, path, size, mimeType, storagePath, isFolder, parentId)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(fileId, userId, fileName, filePath, req.file.size, req.file.mimetype, fullPath, parentId);
    
    // Update storage used
    db.prepare('UPDATE users SET storageUsed = storageUsed + ? WHERE id = ?')
      .run(req.file.size, userId);
    
    // Log activity
    const { v4: uuidv4Activity } = await import('uuid');
    db.prepare(`
      INSERT INTO activityLog (id, userId, action, fileId, details)
      VALUES (?, ?, 'upload', ?, ?)
    `).run(uuidv4Activity(), userId, fileId, JSON.stringify({ fileName, size: req.file.size }));
    
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

// Download file (with optional shared access)
router.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    const fileId = req.params.id;
    const isShared = req.query.shared === 'true';
    let userId = req.user?.id;
    
    // If not shared, require auth
    if (!isShared && !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let file: { name: string; storagePath: string; mimeType: string; userId: string } | undefined;
    
    if (isShared) {
      // For shared links, just verify file exists
      file = db.prepare(`
        SELECT name, storagePath, mimeType, userId
        FROM files WHERE id = ?
      `).get(fileId) as { name: string; storagePath: string; mimeType: string; userId: string } | undefined;
    } else {
      file = db.prepare(`
        SELECT name, storagePath, mimeType, userId
        FROM files WHERE id = ? AND userId = ?
      `).get(fileId, userId) as { name: string; storagePath: string; mimeType: string; userId: string } | undefined;
    }
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    res.download(file.storagePath, file.name);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});

// Delete file
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user!.id;
    
    const file = db.prepare(`
      SELECT id, name, path, size, storagePath, isFolder
      FROM files WHERE id = ? AND userId = ?
    `).get(fileId, userId) as { id: string; name: string; path: string; size: number; storagePath: string; isFolder: number } | undefined;
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete from storage (only for files, not folders)
    if (file.isFolder === 0) {
      try {
        await fs.unlink(file.storagePath);
      } catch (err) {
        console.error('Failed to delete file from storage:', err);
      }
    }
    
    // Delete from database (cascades to children)
    db.prepare('DELETE FROM files WHERE id = ?').run(fileId);
    
    // Update storage used
    if (file.isFolder === 0) {
      db.prepare('UPDATE users SET storageUsed = MAX(0, storageUsed - ?) WHERE id = ?')
        .run(file.size, userId);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
