import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';

const ActivityLog = {
  async create({ userId, action, fileId, metadata }) {
    const id = uuidv4();
    await db.query(
      `INSERT INTO activity_logs (id, user_id, action, file_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, action, fileId, JSON.stringify(metadata)]
    );
    return { id, user_id: userId, action, file_id: fileId, metadata };
  },

  async findByUser(userId, limit = 50) {
    const result = await db.query(
      `SELECT al.*, f.filename 
       FROM activity_logs al 
       LEFT JOIN files f ON al.file_id = f.id 
       WHERE al.user_id = $1 
       ORDER BY al.timestamp DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },
};

export default ActivityLog;
