-- Update view_mode column to support grid2 view mode
-- Run this in your Supabase SQL editor

-- Update the check constraint to include 'grid2'
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_view_mode_check;
ALTER TABLE collections ADD CONSTRAINT collections_view_mode_check 
  CHECK (view_mode IN ('card', 'compact', 'list', 'grid', 'grid2'));

-- Update existing 'card' values to 'grid' for consistency
UPDATE collections SET view_mode = 'grid' WHERE view_mode = 'card';

-- Set default to 'grid' instead of 'card'
ALTER TABLE collections ALTER COLUMN view_mode SET DEFAULT 'grid';
