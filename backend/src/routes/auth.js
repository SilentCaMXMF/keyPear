import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Session, ActivityLog } from '../models/index.js';
import web3Routes from './auth/web3.js';

const router = express.Router();

const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const getAccessToken = (userId) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};

const getRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

router.use('/web3', web3Routes);

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_REFRESH_SECRET not set' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await Session.findByRefreshToken(refreshToken);

    if (session) {
      await Session.delete(session.id);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_REFRESH_SECRET not set' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const session = await Session.findByRefreshToken(refreshToken);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (new Date(session.expires_at) < new Date()) {
      await Session.delete(session.id);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    await Session.delete(session.id);

    const newAccessToken = getAccessToken(decoded.userId);
    const newRefreshToken = getRefreshToken(decoded.userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: decoded.userId, refreshToken: newRefreshToken, expiresAt });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
