import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    
    const folderId = uuidv4();
    await db.query(
      `INSERT INTO folders (id, user_id, parent_folder_id, name) VALUES ($1, $2, $3, $4)`,
      [folderId, req.userId, parentFolderId || null, name]
    );
    
    res.status(201).json({ id: folderId, name, parentFolderId });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Failed to create folder' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { parentFolderId } = req.query;
    const folders = await db.query(
      `SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL${parentFolderId ? ' AND parent_folder_id = $2' : ' AND parent_folder_id IS NULL'}`,
      parentFolderId ? [req.userId, parentFolderId] : [req.userId]
    );
    res.json({ folders: folders.rows });
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    await db.query('UPDATE folders SET name = $1 WHERE id = $2', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({ message: 'Failed to rename folder' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query(`UPDATE folders SET deleted_at = datetime('now') WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;
