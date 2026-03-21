import express from 'express';
import { ActivityLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.findByUser(req.userId, parseInt(limit));
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list activity logs' });
  }
});

export default router;
