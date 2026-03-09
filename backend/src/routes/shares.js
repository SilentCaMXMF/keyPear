const express = require('express');
const crypto = require('crypto');
const { Share, File } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { fileId, expiresIn } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    const file = await File.findById(fileId);
    if (!file || file.user_id !== req.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    const share = await Share.create({ fileId, token, expiresAt });

    res.status(201).json({
      share: {
        id: share.id,
        token: share.token,
        expiresAt: share.expires_at,
        file: { id: file.id, filename: file.filename, size: file.size },
      },
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

router.get('/:token', async (req, res) => {
  try {
    const share = await Share.findByToken(req.params.token);
    if (!share) {
      return res.status(404).json({ error: 'Share not found or expired' });
    }

    res.json({
      share: {
        id: share.id,
        filename: share.filename,
        size: share.size,
        expiresAt: share.expires_at,
      },
    });
  } catch (error) {
    console.error('Get share error:', error);
    res.status(500).json({ error: 'Failed to get share' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const file = await File.findById(share.file_id);
    if (!file || file.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Share.delete(req.params.id);

    res.json({ message: 'Share deleted' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

module.exports = router;
