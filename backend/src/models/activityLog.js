import { db } from '../services/database.js';

const ActivityLog = {
  async create({ userId, action, fileId, metadata }) {
    const result = await db.query(
      `INSERT INTO activity_logs (id, user_id, action, file_id, metadata)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4)
       RETURNING *`,
      [userId, action, fileId, JSON.stringify(metadata)]
    );
    return result.rows[0];
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
