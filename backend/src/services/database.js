import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pg;

// For SQLite (local dev without PostgreSQL)
let dbWrapper;

const useSQLite = !process.env.DATABASE_URL;

if (useSQLite) {
  // Fallback to simple file-based JSON storage for demo
  const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = join(dataDir, 'keypear.json');
  
  dbWrapper = {
    query: (text, params) => {
      // Simple mock for demo - in production use PostgreSQL
      return Promise.resolve({ rows: [] });
    }
  };
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  dbWrapper = {
    query: (text, params) => pool.query(text, params),
  };
}

export { dbWrapper as db };

export async function initDatabase() {
  console.log('Database initialized (demo mode)');
}
