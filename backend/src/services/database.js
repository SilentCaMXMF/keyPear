import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env') });

const dbPath = process.env.DATABASE_PATH || './data/keypear.db';
let db = null;
let initialized = false;

function convertParams(sql, params) {
  let result = sql;
  params.forEach((_, i) => {
    result = result.replace(`$${i + 1}`, '?');
  });
  return result;
}

export async function initDatabase() {
  if (initialized) return db;
  
  try {
    const SQL = await initSqlJs();
    
    const dbDir = dirname(dbPath);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        oauth_provider TEXT,
        oauth_id TEXT,
        storageQuota INTEGER DEFAULT 10737418240,
        storageUsed INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
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
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        parentId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        refreshToken TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        fileId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS activityLog (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        fileId TEXT,
        details TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS chunk_uploads (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        filename TEXT NOT NULL,
        total_chunks INTEGER NOT NULL,
        total_size INTEGER NOT NULL,
        upload_path TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    saveDatabase();
    console.log('Database initialized');
    initialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }
}

export const dbWrapper = {
  query: (sql, params = []) => {
    if (!initialized || !db) {
      return { rows: [] };
    }
    try {
      const convertedSql = convertParams(sql, params);
      const stmt = getDatabase().prepare(convertedSql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows: results };
    } catch (error) {
      console.error('Query error:', error);
      return { rows: [] };
    }
  },
  run: (sql, params = []) => {
    if (!initialized || !db) {
      return { changes: 0 };
    }
    try {
      const convertedSql = convertParams(sql, params);
      getDatabase().run(convertedSql, params);
      saveDatabase();
      return { changes: getDatabase().getRowsModified() };
    } catch (error) {
      console.error('Run error:', error);
      return { changes: 0 };
    }
  }
};
