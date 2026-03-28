import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../models/index.js';
import { Folder, ActivityLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const folder = await Folder.create({
      userId: req.userId,
      parentFolderId: parentFolderId || null,
      name,
    });
    
    await ActivityLog.create({ userId: req.userId, action: 'folder_create', fileId: folder.id, metadata: { name } });
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { parentFolderId, search } = req.query;
    
    let folders;
    if (search) {
      folders = await Folder.search(req.userId, search);
    } else {
      folders = await Folder.findByUser(req.userId, parentFolderId || null);
    }
    
    res.json({ folders });
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

router.get('/tree', authenticate, async (req, res) => {
  try {
    const folders = await Folder.getTree(req.userId);
    res.json({ folders });
  } catch (error) {
    console.error('Get folder tree error:', error);
    res.status(500).json({ error: 'Failed to get folder tree' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (parentFolderId !== undefined) {
      if (parentFolderId === req.params.id) {
        return res.status(400).json({ error: 'Cannot move folder into itself' });
      }
      await Folder.move(req.params.id, parentFolderId || null);
      await ActivityLog.create({ userId: req.userId, action: 'folder_move', fileId: req.params.id, metadata: { parentFolderId } });
      return res.json({ id: req.params.id, parent_folder_id: parentFolderId || null });
    }

    if (name !== undefined) {
      await Folder.update(req.params.id, { name });
      await ActivityLog.create({ userId: req.userId, action: 'folder_rename', fileId: req.params.id, metadata: { oldName: folder.name, newName: name } });
      return res.json({ id: req.params.id, name });
    }

    res.status(400).json({ error: 'No valid update fields provided' });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

router.post('/:id/copy', authenticate, async (req, res) => {
  try {
    const { parentFolderId } = req.body;
    const original = await Folder.findById(req.params.id);
    
    if (!original || original.user_id !== req.userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const newFolder = await Folder.create({
      userId: req.userId,
      parentFolderId: parentFolderId || original.parent_folder_id,
      name: `${original.name}_copy`,
    });

    await ActivityLog.create({ userId: req.userId, action: 'folder_copy', fileId: newFolder.id, metadata: { originalId: original.id } });

    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Copy folder error:', error);
    res.status(500).json({ error: 'Failed to copy folder' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { permanent } = req.query;
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (permanent === 'true') {
      await Folder.deleteRecursive(req.userId, req.params.id);
      return res.json({ message: 'Folder permanently deleted' });
    }

    await Folder.softDelete(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'folder_delete', fileId: req.params.id, metadata: { name: folder.name } });
    res.json({ message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.userId) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await Folder.restore(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'folder_restore', fileId: req.params.id, metadata: { name: folder.name } });
    res.json({ message: 'Folder restored' });
  } catch (error) {
    console.error('Restore folder error:', error);
    res.status(500).json({ error: 'Failed to restore folder' });
  }
});

router.get('/trash', authenticate, async (req, res) => {
  try {
    const folders = await Folder.findTrashed(req.userId);
    res.json({ folders });
  } catch (error) {
    console.error('List trash error:', error);
    res.status(500).json({ error: 'Failed to list trashed folders' });
  }
});

export default router;
