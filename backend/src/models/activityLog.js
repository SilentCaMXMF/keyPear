import { dbWrapper } from '../services/database.js';

export const ActivityLog = {
  async create({ userId, action, fileId, metadata }) {
    const id = crypto.randomUUID();
    await dbWrapper.run(
      'INSERT INTO activityLog (id, userId, action, fileId, details) VALUES (?, ?, ?, ?, ?)',
      [id, userId, action, fileId, JSON.stringify(metadata)]
    );
    return { id, userId, action, fileId };
  },

  async findByUser(userId, limit = 50) {
    const result = await dbWrapper.query(
      'SELECT a.*, f.name as filename FROM activityLog a LEFT JOIN files f ON a.fileId = f.id WHERE a.userId = ? ORDER BY a.createdAt DESC LIMIT ?',
      [userId, limit]
    );
    return result.rows;
  },
};
