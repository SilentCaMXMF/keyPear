import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { db } from '../services/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ensureStorageDir, SMB_MOUNT_PATH, USER_STORAGE_FOLDER } from './files.js';

const router = Router();

// Create folder
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, path = '/' } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    
    const userId = req.user!.id;
    
    // Check if folder already exists in this path
    const existing = db.prepare(`
      SELECT id FROM files WHERE userId = ? AND path = ? AND name = ? AND isFolder = 1
    `).get(userId, path, name);
    
    if (existing) {
      return res.status(400).json({ message: 'Folder already exists' });
    }
    
    const folderId = uuidv4();
    const folderPath = join(path, name);
    
    // Get parent folder ID
    let parentId = null;
    if (path !== '/') {
      const parent = db.prepare('SELECT id FROM files WHERE userId = ? AND path = ? AND name = ? AND isFolder = 1')
        .get(userId, path, basename(path)) as { id: string } | undefined;
      parentId = parent?.id || null;
    }
    
    // Save to database (no actual storage for folders)
    db.prepare(`
      INSERT INTO files (id, userId, name, path, size, mimeType, storagePath, isFolder, parentId)
      VALUES (?, ?, ?, ?, 0, 'application/x-folder', '', 1, ?)
    `).run(folderId, userId, name, path, parentId);
    
    res.status(201).json({
      id: folderId,
      name,
      path,
      type: 'folder',
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
});

// Rename folder
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const folderId = req.params.id;
    const { name } = req.body;
    const userId = req.user!.id;
    
    if (!name) {
      return res.status(400).json({ message: 'New name is required' });
    }
    
    const folder = db.prepare(`
      SELECT id, name, path, isFolder
      FROM files WHERE id = ? AND userId = ?
    `).get(folderId, userId) as { id: string; name: string; path: string; isFolder: number } | undefined;
    
    if (!folder || folder.isFolder !== 1) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Update folder name
    db.prepare('UPDATE files SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, folderId);
    
    res.json({ id: folderId, name, path: folder.path });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ message: 'Failed to rename folder' });
  }
});

export default router;
