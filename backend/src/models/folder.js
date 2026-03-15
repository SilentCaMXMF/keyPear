const db = require('./db');

const Folder = {
  async create({ userId, parentFolderId, name }) {
    const result = await db.query(
      `INSERT INTO folders (user_id, parent_folder_id, name)
       VALUES ($1, $2, $3)
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
    let query = `SELECT * FROM folders WHERE user_id = $1 AND parent_folder_id <=> $2`;
    const params = [userId, parentFolderId];

    if (!includeDeleted) {
      query += ` AND deleted_at IS NULL`;
    }

    query += ` ORDER BY name`;

    const result = await db.query(query, params);
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
      `UPDATE folders SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
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

module.exports = Folder;
