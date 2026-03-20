import { dbWrapper } from '../services/database.js';

export const File = {
  async create({ userId, folderId, filename, storagePath, thumbnailPath, size, mimeType, checksum }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO files (id, userId, name, path, storagePath, size, mimeType, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, filename, '', storagePath, size, mimeType, folderId]
    );
    return { id, userId, folderId, filename, storagePath, size, mimeType };
  },

  async findById(id) {
    const result = await dbWrapper.query('SELECT * FROM files WHERE id = ?', [id]);
    return result.rows[0];
  },

  async findByUser(userId, folderId = null) {
    const result = await dbWrapper.query(
      'SELECT * FROM files WHERE userId = ? AND parentId = ? ORDER BY createdAt DESC',
      [userId, folderId]
    );
    return result.rows;
  },

  async delete(id) {
    await dbWrapper.run('DELETE FROM files WHERE id = ?', [id]);
  },
};
