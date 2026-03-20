import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { join, basename } from 'path';
import { dbWrapper } from '../services/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create folder
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, path = '/' } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    
    const userId = req.user!.id;
    
    const existing = dbWrapper.query(
      'SELECT id FROM files WHERE userId = ? AND path = ? AND name = ? AND isFolder = 1',
      [userId, path, name]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Folder already exists' });
    }
    
    const folderId = uuidv4();
    
    let parentId = null;
    if (path !== '/') {
      const parent = dbWrapper.query(
        'SELECT id FROM files WHERE userId = ? AND path = ? AND isFolder = 1',
        [userId, path]
      );
      parentId = parent.rows[0]?.id || null;
    }
    
    dbWrapper.run(
      'INSERT INTO files (id, userId, name, path, size, mimeType, storagePath, isFolder, parentId) VALUES (?, ?, ?, ?, 0, ?, ?, 1, ?)',
      [folderId, userId, name, path, 'application/x-folder', '', parentId]
    );
    
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
    
    const result = dbWrapper.query(
      'SELECT id, name, path, isFolder FROM files WHERE id = ? AND userId = ?',
      [folderId, userId]
    );
    const folder = result.rows[0] as { id: string; name: string; path: string; isFolder: number } | undefined;
    
    if (!folder || folder.isFolder !== 1) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    dbWrapper.run(
      'UPDATE files SET name = ?, updatedAt = ? WHERE id = ?',
      [name, new Date().toISOString(), folderId]
    );
    
    res.json({ id: folderId, name, path: folder.path });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ message: 'Failed to rename folder' });
  }
});

export default router;
