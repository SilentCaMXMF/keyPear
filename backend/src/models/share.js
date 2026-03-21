import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const Share = {
  async create({ fileId, token, expiresAt, sharedWithEmail = null, sharedWithUserId = null }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO shares (id, file_id, token, expires_at, shared_with_email, shared_with_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, fileId, token, expiresAt, sharedWithEmail, sharedWithUserId]
    );
    return { id, file_id: fileId, token, expires_at: expiresAt, shared_with_email: sharedWithEmail, shared_with_user_id: sharedWithUserId };
  },

  async findByToken(token) {
    const result = await db.query(
      `SELECT s.*, f.filename 
       FROM shares s 
       LEFT JOIN files f ON s.file_id = f.id 
       WHERE s.token = $1`,
      [token]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM shares WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await db.query(
      `SELECT s.*, f.filename, f.size, f.mime_type, f.thumbnail_path, f.storage_path
       FROM shares s 
       LEFT JOIN files f ON s.file_id = f.id 
       WHERE f.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async findSharedWithUser(userId) {
    const result = await db.query(
      `SELECT s.*, f.filename, f.size, f.mime_type, f.thumbnail_path, f.storage_path, u.name as shared_by_name
       FROM shares s 
       JOIN files f ON s.file_id = f.id
       JOIN users u ON f.user_id = u.id
       WHERE s.shared_with_email = $1 OR s.shared_with_user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    await db.query('DELETE FROM shares WHERE id = $1', [id]);
  },
};

export default Share;
