import { dbWrapper } from '../services/database.js';

export const ChunkUpload = {
  async create({ userId, filename, totalChunks, totalSize, mimeType, folderId, uploadPath, expiresAt }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO chunk_uploads (id, userId, filename, total_chunks, total_size, upload_path, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, filename, totalChunks, totalSize, uploadPath, expiresAt]
    );
    return { id, userId, filename, totalChunks, totalSize };
  },

  async findById(id) {
    const result = await dbWrapper.query('SELECT * FROM chunk_uploads WHERE id = ?', [id]);
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await dbWrapper.query(
      'SELECT * FROM chunk_uploads WHERE userId = ? AND expiresAt > ? ORDER BY createdAt DESC',
      [userId, new Date().toISOString()]
    );
    return result.rows;
  },

  async delete(id) {
    await dbWrapper.run('DELETE FROM chunk_uploads WHERE id = ?', [id]);
  },

  async deleteExpired() {
    await dbWrapper.run('DELETE FROM chunk_uploads WHERE expiresAt < ?', [new Date().toISOString()]);
  },
};
