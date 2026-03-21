import { db } from '../services/database.js';

const Folder = {
  async create({ userId, parentFolderId, name }) {
    const result = await db.query(
      `INSERT INTO folders (id, user_id, parent_folder_id, name)
       VALUES (uuid_generate_v4(), $1, $2, $3)
       RETURNING *`,
      [userId, parentFolderId, name]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM folders WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId, parentFolderId = null, includeDeleted = false) {
    let query = `SELECT * FROM folders WHERE user_id = $1 AND parent_folder_id = $2`;
    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }
    const result = await db.query(query, [userId, parentFolderId]);
    return result.rows;
  },

  async update(id, { name }) {
    const result = await db.query(
      'UPDATE folders SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  },

  async softDelete(id) {
    const result = await db.query(
      `UPDATE folders SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async restore(id) {
    const result = await db.query(
      `UPDATE folders SET deleted_at = NULL WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM folders WHERE id = $1', [id]);
  },
};

export default Folder;
