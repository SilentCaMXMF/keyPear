import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const dbPath = process.env.DATABASE_PATH || './data/keypear.db';
export const db = new Database(dbPath);

export function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      storageQuota INTEGER DEFAULT 10737418240,
      storageUsed INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mimeType TEXT,
      storagePath TEXT NOT NULL,
      isFolder INTEGER DEFAULT 0,
      parentId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES files(id) ON DELETE CASCADE
    )
  `);
  
  // Create shared links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shareLinks (
      id TEXT PRIMARY KEY,
      fileId TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
    )
  `);
  
  // Create activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activityLog (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      fileId TEXT,
      details TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_userId ON files(userId);
    CREATE INDEX IF NOT EXISTS idx_files_parentId ON files(parentId);
    CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
    CREATE INDEX IF NOT EXISTS idx_activity_userId ON activityLog(userId);
  `);
  
  console.log('Database initialized');
}
