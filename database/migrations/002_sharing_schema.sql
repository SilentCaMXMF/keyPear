-- Add shared_with columns to shares table for user-to-user sharing
ALTER TABLE shares ADD COLUMN IF NOT EXISTS shared_with_email VARCHAR(255);
ALTER TABLE shares ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for finding shares by user
CREATE INDEX IF NOT EXISTS idx_shares_shared_with_email ON shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with_user_id ON shares(shared_with_user_id);
