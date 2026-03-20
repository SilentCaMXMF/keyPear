import { dbWrapper } from '../services/database.js';

export const Session = {
  async create({ userId, refreshToken, expiresAt }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO sessions (id, userId, refreshToken, expiresAt) VALUES (?, ?, ?, ?)',
      [id, userId, refreshToken, expiresAt]
    );
    return { id, userId, expiresAt };
  },

  async findById(id) {
    const result = await dbWrapper.query('SELECT * FROM sessions WHERE id = ?', [id]);
    return result.rows[0];
  },

  async findByRefreshToken(refreshToken) {
    const result = await dbWrapper.query(
      'SELECT * FROM sessions WHERE refreshToken = ? AND expiresAt > ?',
      [refreshToken, new Date().toISOString()]
    );
    return result.rows[0];
  },

  async delete(id) {
    await dbWrapper.run('DELETE FROM sessions WHERE id = ?', [id]);
  },

  async deleteByUserId(userId) {
    await dbWrapper.run('DELETE FROM sessions WHERE userId = ?', [userId]);
  },

  async deleteExpired() {
    await dbWrapper.run('DELETE FROM sessions WHERE expiresAt < ?', [new Date().toISOString()]);
  },
};
