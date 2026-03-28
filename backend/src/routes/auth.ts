import { Router } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { dbWrapper } from '../services/database.js';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existingUser = dbWrapper.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    dbWrapper.run(
      'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      [userId, name, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const result = dbWrapper.query(
      'SELECT id, name, email, password, storageQuota, storageUsed FROM users WHERE email = ?',
      [email]
    );
    const user = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      password: string;
      storageQuota: number;
      storageUsed: number;
    } | undefined;
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storageQuota: user.storageQuota,
        storageUsed: user.storageUsed,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const result = dbWrapper.query(
    'SELECT id, name, email, storageQuota, storageUsed, createdAt FROM users WHERE id = ?',
    [req.user!.id]
  );
  const user = result.rows[0];
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json(user);
});

router.patch('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const userId = req.user!.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    dbWrapper.run('UPDATE users SET name = ?, updatedAt = ? WHERE id = ?', [name, new Date().toISOString(), userId]);
    
    const result = dbWrapper.query('SELECT id, name, email, storageQuota, storageUsed, createdAt FROM users WHERE id = ?', [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    const result = dbWrapper.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = result.rows[0] as { password: string } | undefined;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dbWrapper.run('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?', [hashedPassword, new Date().toISOString(), userId]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

export default router;
