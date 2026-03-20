import { dbWrapper } from '../services/database.js';

export const Folder = {
  async create({ userId, parentFolderId, name }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO folders (id, userId, parentId, name) VALUES (?, ?, ?, ?)',
      [id, userId, parentFolderId, name]
    );
    return { id, userId, parentFolderId, name };
  },

  async findById(id) {
    const result = await dbWrapper.query('SELECT * FROM folders WHERE id = ?', [id]);
    return result.rows[0];
  },

  async findByUser(userId, parentFolderId = null) {
    const result = await dbWrapper.query(
      'SELECT * FROM folders WHERE userId = ? AND parentId = ?',
      [userId, parentFolderId]
    );
    return result.rows;
  },

  async update(id, { name }) {
    await dbWrapper.run('UPDATE folders SET name = ? WHERE id = ?', [name, id]);
    return { id, name };
  },

  async delete(id) {
    await dbWrapper.run('DELETE FROM folders WHERE id = ?', [id]);
  },
};
