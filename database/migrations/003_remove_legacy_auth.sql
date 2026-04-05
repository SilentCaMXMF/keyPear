-- Remove Legacy Authentication Columns
-- Remove password-based auth columns
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users DROP COLUMN oauth_provider;
ALTER TABLE users DROP COLUMN oauth_id;
