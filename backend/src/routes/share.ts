import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { db } from '../services/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create share link
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { fileId, expiresIn } = req.body; // expiresIn in hours, optional
    const userId = req.user!.id;
    
    if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
    }
    
    // Verify file belongs to user
    const file = db.prepare(`
      SELECT id, name, isFolder, storagePath
      FROM files WHERE id = ? AND userId = ?
    `).get(fileId, userId) as { id: string; name: string; isFolder: number; storagePath: string } | undefined;
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Can't share folders yet
    if (file.isFolder === 1) {
      return res.status(400).json({ message: 'Sharing folders is not supported yet' });
    }
    
    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const shareId = uuidv4();
    
    // Calculate expiry
    let expiresAt = null;
    if (expiresIn) {
      const expiresDate = new Date();
      expiresDate.setHours(expiresDate.getHours() + expiresIn);
      expiresAt = expiresDate.toISOString();
    }
    
    // Save to database
    db.prepare(`
      INSERT INTO shareLinks (id, fileId, token, expiresAt)
      VALUES (?, ?, ?, ?)
    `).run(shareId, fileId, token, expiresAt);
    
    res.status(201).json({
      id: shareId,
      fileId,
      token,
      expiresAt,
      url: `/api/share/${token}`,
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ message: 'Failed to create share link' });
  }
});

// Get share links for a file
router.get('/file/:fileId', authMiddleware, (req: AuthRequest, res) => {
  const { fileId } = req.params;
  const userId = req.user!.id;
  
  // Verify file belongs to user
  const file = db.prepare('SELECT id FROM files WHERE id = ? AND userId = ?').get(fileId, userId);
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  const links = db.prepare(`
    SELECT id, fileId, token, expiresAt, createdAt
    FROM shareLinks WHERE fileId = ?
  `).all(fileId);
  
  res.json(links);
});

// Delete share link
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  
  // Verify link belongs to user's file
  const link = db.prepare(`
    SELECT sl.id FROM shareLinks sl
    JOIN files f ON sl.fileId = f.id
    WHERE sl.id = ? AND f.userId = ?
  `).get(id, userId) as { id: string } | undefined;
  
  if (!link) {
    return res.status(404).json({ message: 'Share link not found' });
  }
  
  db.prepare('DELETE FROM shareLinks WHERE id = ?').run(id);
  
  res.json({ message: 'Share link deleted' });
});

// Public endpoint: Download via share link
router.get('/:token', async (req: AuthRequest, res) => {
  const { token } = req.params;
  
  // Find share link
  const link = db.prepare(`
    SELECT sl.id, sl.fileId, sl.expiresAt, f.name, f.storagePath
    FROM shareLinks sl
    JOIN files f ON sl.fileId = f.id
    WHERE sl.token = ?
  `).get(token) as { 
    id: string; 
    fileId: string; 
    expiresAt: string | null; 
    name: string; 
    storagePath: string;
  } | undefined;
  
  if (!link) {
    return res.status(404).json({ message: 'Share link not found' });
  }
  
  // Check expiry
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return res.status(410).json({ message: 'Share link has expired' });
  }
  
  // Redirect to download
  res.redirect(`/api/files/${link.fileId}/download?shared=true`);
});

export default router;
