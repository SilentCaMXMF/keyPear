import { db } from '../services/database.js';

const ChunkUpload = {
  async create({ userId, filename, totalChunks, totalSize, mimeType, folderId, uploadPath, expiresAt }) {
    const result = await db.query(
      `INSERT INTO chunk_uploads (id, user_id, filename, total_chunks, total_size, mime_type, folder_id, upload_path, expires_at)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, filename, totalChunks, totalSize, mimeType, folderId, uploadPath, expiresAt]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM chunk_uploads WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await db.query(
      'SELECT * FROM chunk_uploads WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async delete(id) {
    await db.query('DELETE FROM chunk_uploads WHERE id = $1', [id]);
  },
};

export default ChunkUpload;
