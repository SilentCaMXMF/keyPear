-- Web3 Authentication Migration
-- Add wallet_address to users table (becomes the primary identity)
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE;

-- Add ENS name (optional)
ALTER TABLE users ADD COLUMN ens_name VARCHAR(255);

-- Make email optional (no longer required)
-- Note: SQLite doesn't support DROP NOT NULL constraint, handled in database.js

-- Create index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
