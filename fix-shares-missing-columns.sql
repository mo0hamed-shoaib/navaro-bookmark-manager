-- Add missing columns to shares table
-- Run this in your Supabase SQL editor

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shares' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE shares ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to shares table';
  ELSE
    RAISE NOTICE 'name column already exists in shares table';
  END IF;
  
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shares' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE shares ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to shares table';
  ELSE
    RAISE NOTICE 'description column already exists in shares table';
  END IF;
END $$;

-- Verify the complete table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shares' 
ORDER BY ordinal_position;
