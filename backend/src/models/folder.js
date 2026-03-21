import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const Folder = {
  async create({ userId, parentFolderId, name }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO folders (id, user_id, parent_folder_id, name)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, parentFolderId, name]
    );
    return { id, user_id: userId, parent_folder_id: parentFolderId, name };
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM folders WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByUser(userId, parentFolderId = null) {
    let sql = `SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL`;
    const params = [userId];
    
    if (parentFolderId) {
      sql += ` AND parent_folder_id = $2`;
      params.push(parentFolderId);
    }
    
    const result = await db.query(sql, params);
    return result.rows;
  },

  async update(id, { name }) {
    await db.query('UPDATE folders SET name = $1 WHERE id = $2', [name, id]);
    return { id, name };
  },

  async softDelete(id) {
    await db.query(`UPDATE folders SET deleted_at = datetime('now') WHERE id = $1`, [id]);
  },

  async delete(id) {
    await db.query('DELETE FROM folders WHERE id = $1', [id]);
  },
};

export default Folder;
