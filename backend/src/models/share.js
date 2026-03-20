import { dbWrapper } from '../services/database.js';

export const Share = {
  async create({ fileId, token, expiresAt }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO shares (id, fileId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [id, fileId, token, expiresAt]
    );
    return { id, fileId, token, expiresAt };
  },

  async findByToken(token) {
    const result = await dbWrapper.query(
      'SELECT * FROM shares WHERE token = ?',
      [token]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await dbWrapper.query('SELECT * FROM shares WHERE id = ?', [id]);
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await dbWrapper.query(
      'SELECT s.*, f.name as filename FROM shares s JOIN files f ON s.fileId = f.id WHERE f.userId = ?',
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    await dbWrapper.run('DELETE FROM shares WHERE id = ?', [id]);
  },
};
