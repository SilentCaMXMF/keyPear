const express = require('express');
const { ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.findByUser(req.userId, parseInt(limit));
    res.json({ logs });
  } catch (error) {
    console.error('List logs error:', error);
    res.status(500).json({ error: 'Failed to list activity logs' });
  }
});

module.exports = router;
