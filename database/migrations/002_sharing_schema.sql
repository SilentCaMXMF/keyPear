-- Add shared_with columns to shares table for user-to-user sharing
-- SQLite compatible syntax (no IF NOT EXISTS for ALTER TABLE, use try/catch in code)
ALTER TABLE shares ADD COLUMN shared_with_email TEXT;
ALTER TABLE shares ADD COLUMN shared_with_user_id TEXT;
ALTER TABLE shares ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;
