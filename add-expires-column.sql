-- Add missing expires_at column to shares table
-- Run this in your Supabase SQL editor

-- Check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shares' 
    AND column_name = 'expires_at'
  ) THEN
    -- Add the missing column
    ALTER TABLE shares ADD COLUMN expires_at TIMESTAMP;
    
    -- Add index for the new column
    CREATE INDEX idx_shares_expires_at ON shares(expires_at);
    
    RAISE NOTICE 'Added expires_at column to shares table';
  ELSE
    RAISE NOTICE 'expires_at column already exists in shares table';
  END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shares' 
ORDER BY ordinal_position;
