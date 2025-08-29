-- Add NOT NULL and validation constraints to creators table
-- This ensures creators cannot be created without username, wallet, and pfp

BEGIN;

-- First, clean up any existing creators that have null or empty values
-- (Optional: You might want to handle these differently based on your data)
UPDATE creators 
SET username = 'Anonymous_' || creator_id::text
WHERE username IS NULL OR trim(username) = '';

UPDATE creators 
SET pfp = 'https://via.placeholder.com/150/000000/FFFFFF/?text=' || substr(wallet, 3, 4)
WHERE pfp IS NULL OR trim(pfp) = '';

-- Add NOT NULL constraints
ALTER TABLE creators 
ALTER COLUMN username SET NOT NULL,
ALTER COLUMN pfp SET NOT NULL;

-- Add check constraints to ensure they're not empty strings
ALTER TABLE creators 
ADD CONSTRAINT creators_username_not_empty 
CHECK (username IS NOT NULL AND trim(username) != ''),

ADD CONSTRAINT creators_pfp_not_empty 
CHECK (pfp IS NOT NULL AND trim(pfp) != ''),

ADD CONSTRAINT creators_wallet_not_empty 
CHECK (wallet IS NOT NULL AND trim(wallet) != '');

-- Add additional validation constraints
ALTER TABLE creators 
ADD CONSTRAINT creators_wallet_format 
CHECK (wallet ~* '^0x[a-f0-9]{40}$'),

ADD CONSTRAINT creators_username_length 
CHECK (length(trim(username)) >= 1 AND length(trim(username)) <= 50),

ADD CONSTRAINT creators_pfp_url_format 
CHECK (pfp ~* '^https?://.*');

-- Create a function to validate creator data before insert/update
CREATE OR REPLACE FUNCTION validate_creator_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate username
  IF NEW.username IS NULL OR trim(NEW.username) = '' THEN
    RAISE EXCEPTION 'Username is required and cannot be empty';
  END IF;
  
  -- Validate pfp
  IF NEW.pfp IS NULL OR trim(NEW.pfp) = '' THEN
    RAISE EXCEPTION 'Profile picture URL is required and cannot be empty';
  END IF;
  
  -- Validate wallet format
  IF NEW.wallet IS NULL OR NOT (NEW.wallet ~* '^0x[a-f0-9]{40}$') THEN
    RAISE EXCEPTION 'Valid Ethereum wallet address is required';
  END IF;
  
  -- Ensure wallet is lowercase
  NEW.wallet = lower(NEW.wallet);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate data on insert/update
DROP TRIGGER IF EXISTS validate_creator_trigger ON creators;
CREATE TRIGGER validate_creator_trigger
  BEFORE INSERT OR UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION validate_creator_data();

-- Create index on username for better search performance
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);

-- Add comment to document the constraints
COMMENT ON TABLE creators IS 'Creators table with required username, pfp, and wallet fields. All fields are validated on insert/update.';
COMMENT ON COLUMN creators.username IS 'Required: User display name (1-50 characters)';
COMMENT ON COLUMN creators.pfp IS 'Required: Profile picture URL (must be valid HTTP/HTTPS URL)';
COMMENT ON COLUMN creators.wallet IS 'Required: Ethereum wallet address (must be valid 0x format, stored lowercase)';

COMMIT;
