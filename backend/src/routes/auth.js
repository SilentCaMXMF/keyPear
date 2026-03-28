import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User, Session, ActivityLog } from '../models/index.js';

const router = express.Router();

const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

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

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const emailValidator = body('email')
  .isEmail()
  .normalizeEmail()
  .isLength({ max: MAX_EMAIL_LENGTH })
  .withMessage('Valid email required (max 255 chars)');

const passwordValidator = body('password')
  .isLength({ min: MIN_PASSWORD_LENGTH })
  .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);

router.post('/register', [
  emailValidator,
  passwordValidator,
  body('name')
    .optional()
    .isLength({ max: MAX_NAME_LENGTH })
    .withMessage(`Name must be at most ${MAX_NAME_LENGTH} characters`),
  validateRequest,
], async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const sanitizedEmail = sanitize(email);
    const sanitizedName = name ? sanitize(name) : null;

    const existingUser = await User.findByEmail(sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: sanitizedEmail, passwordHash, name: sanitizedName });

    const accessToken = getAccessToken(user.id);
    const refreshToken = getRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({ userId: user.id, refreshToken, expiresAt });
    await ActivityLog.create({ userId: user.id, action: 'register', metadata: { email: sanitizedEmail } });

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

router.post('/login', [
  emailValidator,
  body('password').notEmpty().withMessage('Password required'),
  validateRequest,
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmail = sanitize(email);

    const user = await User.findByEmail(sanitizedEmail);
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

    await Session.deleteByUserId(user.id);
    await Session.create({ userId: user.id, refreshToken, expiresAt });
    await ActivityLog.create({ userId: user.id, action: 'login', metadata: { email: sanitizedEmail } });

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
