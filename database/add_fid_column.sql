-- Add FID column to users table to support notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS fid integer;

-- Create index for efficient FID lookups
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid);

-- Add constraint to ensure FID uniqueness if provided
ALTER TABLE users ADD CONSTRAINT unique_fid_when_not_null UNIQUE (fid) DEFERRABLE INITIALLY DEFERRED;