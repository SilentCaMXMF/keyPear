import initSqlJs from 'sql.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

let db = null;
let initPromise = null;

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const dbPath = join(dataDir, 'keypear.db');

async function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      oauth_provider TEXT,
      oauth_id TEXT,
      name TEXT,
      wallet_address TEXT UNIQUE,
      ens_name TEXT,
      storage_quota INTEGER DEFAULT 10737418240,
      storage_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      folder_id TEXT,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      thumbnail_path TEXT,
      size INTEGER DEFAULT 0,
      mime_type TEXT,
      checksum TEXT,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_folder_id TEXT,
      name TEXT NOT NULL,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      file_id TEXT,
      metadata TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chunk_uploads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      total_chunks INTEGER NOT NULL,
      total_size INTEGER NOT NULL,
      mime_type TEXT,
      folder_id TEXT,
      upload_path TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add wallet columns for Web3 auth (safe if already exist)
  try { db.run(`ALTER TABLE users ADD COLUMN wallet_address TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE users ADD COLUMN ens_name TEXT`); } catch (e) {}
  db.run('CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)');

  // Add missing columns to shares table (safe if already exist)
  try { db.run(`ALTER TABLE shares ADD COLUMN shared_with_email TEXT`); } catch (e) {}
  try { db.run(`ALTER TABLE shares ADD COLUMN shared_with_user_id TEXT`); } catch (e) {}

  db.run('CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_chunk_uploads_user ON chunk_uploads(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_chunk_uploads_expires ON chunk_uploads(expires_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token)');
  db.run('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
  saveDb();
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Convert values to types sql.js can handle
function toDbValue(val) {
  if (val === undefined) return null;
  if (val === null) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

const dbWrapper = {
  query: async (sql, params = []) => {
    if (!db) {
      await initPromise;
    }
    try {
      const normalizedSql = sql.replace(/\$(\d+)/g, '?');
      const convertedParams = params.map(toDbValue);
      
      const stmt = db.prepare(normalizedSql);
      if (convertedParams.length > 0) {
        stmt.bind(convertedParams);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      // Save to disk after write operations
      const sqlType = normalizedSql.trim().toUpperCase();
      if (sqlType.startsWith('INSERT') || sqlType.startsWith('UPDATE') || sqlType.startsWith('DELETE')) {
        saveDb();
      }

      return { rows: results };
    } catch (err) {
      console.error('SQL Error:', err.message);
      throw err;
    }
  }
};

export { dbWrapper as db, initDb as initDatabase };

initPromise = initDb();
initPromise.then(() => {
  console.log('SQLite database initialized at', dbPath);
}).catch(err => {
  console.error('Database initialization failed:', err);
});
