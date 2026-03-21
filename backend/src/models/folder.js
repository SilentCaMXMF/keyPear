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
    } else {
      sql += ` AND parent_folder_id IS NULL`;
    }
    
    sql += ` ORDER BY name ASC`;
    
    const result = await db.query(sql, params);
    return result.rows;
  },

  async search(userId, query) {
    const result = await db.query(
      `SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL AND name LIKE $2 ORDER BY name ASC`,
      [userId, `%${query}%`]
    );
    return result.rows;
  },

  async getTree(userId) {
    const result = await db.query(
      `SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
      [userId]
    );
    return result.rows;
  },

  async update(id, { name }) {
    if (name !== undefined) {
      await db.query('UPDATE folders SET name = $1 WHERE id = $2', [name, id]);
    }
  },

  async move(id, newParentFolderId) {
    await db.query('UPDATE folders SET parent_folder_id = $1 WHERE id = $2', [newParentFolderId, id]);
  },

  async softDelete(id) {
    await db.query(`UPDATE folders SET deleted_at = datetime('now') WHERE id = $1`, [id]);
  },

  async delete(id) {
    await db.query('DELETE FROM folders WHERE id = $1', [id]);
  },

  async deleteRecursive(userId, folderId) {
    const filesResult = await db.query(
      `SELECT storage_path, thumbnail_path FROM files WHERE user_id = $1 AND folder_id = $2`,
      [userId, folderId]
    );
    
    for (const file of filesResult.rows) {
      if (file.storage_path) {
        try { require('fs').unlinkSync(file.storage_path); } catch (e) {}
      }
      if (file.thumbnail_path) {
        try { require('fs').unlinkSync(file.thumbnail_path); } catch (e) {}
      }
    }
    
    await db.query('DELETE FROM files WHERE user_id = $1 AND folder_id = $2', [userId, folderId]);
    
    const subFolders = await db.query(
      `SELECT id FROM folders WHERE user_id = $1 AND parent_folder_id = $2`,
      [userId, folderId]
    );
    
    for (const subFolder of subFolders.rows) {
      await Folder.deleteRecursive(userId, subFolder.id);
    }
    
    await db.query('DELETE FROM folders WHERE id = $1', [folderId]);
  },

  async restore(id) {
    await db.query(`UPDATE folders SET deleted_at = NULL WHERE id = $1`, [id]);
  },

  async findTrashed(userId) {
    const result = await db.query(
      `SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

export default Folder;
