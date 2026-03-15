const db = require('./db');

const Share = {
  async create({ fileId, token, expiresAt }) {
    const result = await db.query(
      `INSERT INTO shares (file_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [fileId, token, expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token) {
    const result = await db.query(
      `SELECT s.*, f.filename, f.storage_path 
       FROM shares s 
       JOIN files f ON s.file_id = f.id 
       WHERE s.token = $1 AND (s.expires_at IS NULL OR s.expires_at > NOW())`,
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
      `SELECT s.*, f.filename 
       FROM shares s 
       JOIN files f ON s.file_id = f.id 
       WHERE f.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    await db.query('DELETE FROM shares WHERE id = $1', [id]);
  },
};

module.exports = Share;
