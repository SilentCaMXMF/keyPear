import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const ChunkUpload = {
  async create({ userId, filename, totalChunks, totalSize, mimeType, folderId, uploadPath, expiresAt }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO chunk_uploads (id, user_id, filename, total_chunks, total_size, mime_type, folder_id, upload_path, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, userId, filename, totalChunks, totalSize, mimeType, folderId, uploadPath, expiresAt]
    );
    return { id, user_id: userId, filename, total_chunks: totalChunks, total_size: totalSize };
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM chunk_uploads WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await db.query(
      'SELECT * FROM chunk_uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    await db.query('DELETE FROM chunk_uploads WHERE id = $1', [id]);
  },
};

export default ChunkUpload;
