const db = require('./db');

const File = {
  async create({ userId, folderId, filename, storagePath, thumbnailPath, size, mimeType, checksum }) {
    const result = await db.query(
      `INSERT INTO files (user_id, folder_id, filename, storage_path, thumbnail_path, size, mime_type, checksum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, folderId, filename, storagePath, thumbnailPath, size, mimeType, checksum]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId, folderId = null, includeDeleted = false) {
    let query = `SELECT * FROM files WHERE user_id = $1 AND folder_id <=> $2`;
    const params = [userId, folderId];

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  async softDelete(id) {
    const result = await db.query(
      `UPDATE files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async restore(id) {
    const result = await db.query(
      `UPDATE files SET deleted_at = NULL WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM files WHERE id = $1', [id]);
  },
};

module.exports = File;
