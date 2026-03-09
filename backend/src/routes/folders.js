const express = require('express');
const { Folder, ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name required' });
    }

    if (parentFolderId) {
      const parent = await Folder.findById(parentFolderId);
      if (!parent || parent.user_id !== req.userId || parent.deleted_at) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }
    }

    const folder = await Folder.create({
      userId: req.userId,
      parentFolderId: parentFolderId || null,
      name,
    });

    await ActivityLog.create({ userId: req.userId, action: 'folder_create', metadata: { folderId: folder.id, name } });

    res.status(201).json({ folder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { parentFolderId, includeDeleted } = req.query;
    const folders = await Folder.findByUser(req.userId, parentFolderId || null, includeDeleted === 'true');
    res.json({ folders });
  } catch (error) {
    console.error('List folders error:', error);
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await Folder.findById(req.params.id);

    if (!folder || folder.user_id !== req.userId || folder.deleted_at) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updated = await Folder.update(req.params.id, { name });
    await ActivityLog.create({ userId: req.userId, action: 'folder_rename', metadata: { folderId: folder.id, name } });

    res.json({ folder: updated });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Failed to update folder' });
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
      await ActivityLog.create({ userId: req.userId, action: 'folder_delete_permanent', metadata: { folderId: folder.id, name: folder.name } });
      await Folder.delete(req.params.id);
      return res.json({ message: 'Folder permanently deleted' });
    }

    await Folder.softDelete(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'folder_delete', metadata: { folderId: folder.id, name: folder.name } });

    res.json({ message: 'Folder moved to trash' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.user_id !== req.userId || !folder.deleted_at) {
      return res.status(404).json({ error: 'Folder not found in trash' });
    }

    await Folder.restore(req.params.id);
    await ActivityLog.create({ userId: req.userId, action: 'folder_restore', metadata: { folderId: folder.id, name: folder.name } });

    res.json({ message: 'Folder restored' });
  } catch (error) {
    console.error('Restore folder error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
});

module.exports = router;
