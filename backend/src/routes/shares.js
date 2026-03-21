import express from 'express';
import crypto from 'crypto';
import { Share, File } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { fileId, expiresIn } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const share = await Share.create({ fileId, token, expiresAt });

    res.status(201).json({ share });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

router.get('/:token', async (req, res) => {
  try {
    const share = await Share.findByToken(req.params.token);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    res.json({ share });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get share' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Share.delete(req.params.id);
    res.json({ message: 'Share deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

export default router;
