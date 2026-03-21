import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Session, ActivityLog } from '../models/index.js';

const router = express.Router();

const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const getAccessToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

const getRefreshToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
);

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, name });

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: user.id, refreshToken, expiresAt });
    await ActivityLog.create({ userId: user.id, action: 'register', metadata: { email } });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: user.id, refreshToken, expiresAt });
    await ActivityLog.create({ userId: user.id, action: 'login', metadata: { email } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const session = await Session.findByRefreshToken(refreshToken);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = getAccessToken(decoded.userId);
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
