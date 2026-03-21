import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const Session = {
  async create({ userId, refreshToken, expiresAt }) {
    const id = uuidv4();
    const result = await db.query(
      `INSERT INTO sessions (id, user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, refreshToken, expiresAt]
    );
    return { id, user_id: userId, refresh_token: refreshToken, expires_at: expiresAt };
  },

  async findByRefreshToken(refreshToken) {
    const result = await db.query(
      `SELECT * FROM sessions WHERE refresh_token = $1`,
      [refreshToken]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM sessions WHERE id = $1', [id]);
  },
};

export default Session;
