const db = require('./db');

const User = {
  async create({ email, passwordHash, oauthProvider, oauthId, name }) {
    const result = await db.query(
      `INSERT INTO users (email, password_hash, oauth_provider, oauth_id, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, storage_used, storage_quota, created_at`,
      [email, passwordHash, oauthProvider, oauthId, name]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id, email, name, storage_used, storage_quota, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByOAuth(provider, oauthId) {
    const result = await db.query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
      [provider, oauthId]
    );
    return result.rows[0];
  },

  async updateStorageUsed(userId, bytes) {
    const result = await db.query(
      `UPDATE users SET storage_used = storage_used + $1 WHERE id = $2 RETURNING storage_used`,
      [bytes, userId]
    );
    return result.rows[0];
  },

  async update(userId, { name }) {
    const result = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name',
      [name, userId]
    );
    return result.rows[0];
  },
};

module.exports = User;
