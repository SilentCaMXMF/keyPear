const db = require('./db');

const Session = {
  async create({ userId, refreshToken, expiresAt }) {
    const result = await db.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, expires_at`,
      [userId, refreshToken, expiresAt]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM sessions WHERE id = $1', [id]);
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

  async deleteByUserId(userId) {
    await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  },

  async deleteExpired() {
    await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
  },
};

module.exports = Session;
