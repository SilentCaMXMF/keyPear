import { dbWrapper as db } from '../services/database.js';

export const User = {
  async create({ email, passwordHash, oauthProvider, oauthId, name }) {
    const result = await db.query(
      `INSERT INTO users (id, email, password, oauth_provider, oauth_id, name)
       VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)
       RETURNING id, email, name, storageQuota, storageUsed, createdAt`,
      [email, passwordHash, oauthProvider, oauthId, name]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id, email, name, storageQuota, storageUsed, createdAt FROM users WHERE id = ?',
      [id]
    );
    return result.rows[0];
  },

  async findByOAuth(provider, oauthId) {
    const result = await db.query(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      [provider, oauthId]
    );
    return result.rows[0];
  },

  async updateStorageUsed(userId, bytes) {
    const result = await db.query(
      `UPDATE users SET storageUsed = storageUsed + ? WHERE id = ? RETURNING storageUsed`,
      [bytes, userId]
    );
    return result.rows[0];
  },

  async update(userId, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.oauthProvider !== undefined) {
      fields.push('oauth_provider = ?');
      values.push(data.oauthProvider);
    }
    if (data.oauthId !== undefined) {
      fields.push('oauth_id = ?');
      values.push(data.oauthId);
    }
    values.push(userId);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? RETURNING id, email, name`,
      values
    );
    return result.rows[0];
  },
};
