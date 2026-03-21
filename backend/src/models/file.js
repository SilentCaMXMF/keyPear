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

  async findByUser(userId, folderId = null, sort = 'created_at', order = 'DESC') {
    const allowedSorts = ['filename', 'created_at', 'size', 'mime_type'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    let sql = `SELECT * FROM files WHERE user_id = $1 AND deleted_at IS NULL`;
    const params = [userId];
    
    if (folderId) {
      sql += ` AND folder_id = $2`;
      params.push(folderId);
    }
    
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;
    
    const result = await db.query(sql, params);
    return result.rows;
  },

  async search(userId, query, folderId = null) {
    const sql = `SELECT * FROM files 
                 WHERE user_id = $1 AND deleted_at IS NULL AND filename LIKE $2
                 ${folderId ? 'AND folder_id = $3' : ''}
                 ORDER BY created_at DESC`;
    const params = folderId ? [userId, `%${query}%`, folderId] : [userId, `%${query}%`];
    
    const result = await db.query(sql, params);
    return result.rows;
  },

  async update(id, { filename, storagePath, thumbnailPath, folderId }) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (filename !== undefined) {
      updates.push(`filename = $${paramIndex++}`);
      params.push(filename);
    }
    if (storagePath !== undefined) {
      updates.push(`storage_path = $${paramIndex++}`);
      params.push(storagePath);
    }
    if (thumbnailPath !== undefined) {
      updates.push(`thumbnail_path = $${paramIndex++}`);
      params.push(thumbnailPath);
    }
    if (folderId !== undefined) {
      updates.push(`folder_id = $${paramIndex++}`);
      params.push(folderId);
    }

    if (updates.length === 0) return;

    params.push(id);
    await db.query(`UPDATE files SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
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
