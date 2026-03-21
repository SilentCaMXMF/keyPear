import { db } from '../services/database.js';

const Session = {
  async create({ userId, refreshToken, expiresAt }) {
    const result = await db.query(
      `INSERT INTO sessions (id, user_id, refresh_token, expires_at)
       VALUES (uuid_generate_v4(), $1, $2, $3)
       RETURNING *`,
      [userId, refreshToken, expiresAt]
    );
    return result.rows[0];
  },

  async findByRefreshToken(refreshToken) {
    const result = await db.query(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM sessions WHERE id = $1', [id]);
  },
};

export default Session;
