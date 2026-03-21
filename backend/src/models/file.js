import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const File = {
  async create({ userId, folderId, filename, storagePath, thumbnailPath, size, mimeType, checksum }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO files (id, user_id, folder_id, filename, storage_path, thumbnail_path, size, mime_type, checksum)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, userId, folderId, filename, storagePath, thumbnailPath, size, mimeType, checksum]
    );
    return { id, user_id: userId, folder_id: folderId, filename, storage_path: storagePath, size };
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM files WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId, folderId = null) {
    let sql = `SELECT * FROM files WHERE user_id = $1 AND deleted_at IS NULL`;
    const params = [userId];
    
    if (folderId) {
      sql += ` AND folder_id = $2`;
      params.push(folderId);
    }
    sql += ` ORDER BY created_at DESC`;
    
    const result = await db.query(sql, params);
    return result.rows;
  },

  async softDelete(id) {
    await db.query(`UPDATE files SET deleted_at = datetime('now') WHERE id = $1`, [id]);
  },

  async restore(id) {
    await db.query(`UPDATE files SET deleted_at = NULL WHERE id = $1`, [id]);
  },

  async delete(id) {
    await db.query('DELETE FROM files WHERE id = $1', [id]);
  },
};

export default File;
