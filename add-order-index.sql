-- Add order_index column to bookmarks table for drag & drop reordering
-- This enables custom manual organization of bookmarks within collections

-- Add the order_index column with default value 0
ALTER TABLE bookmarks ADD COLUMN order_index INTEGER DEFAULT 0;

-- Update existing bookmarks to have sequential order_index based on creation date
-- This ensures existing bookmarks have a proper order (newest first as default)
UPDATE bookmarks 
SET order_index = (
  SELECT row_number() OVER (PARTITION BY collection_id ORDER BY created_at DESC) - 1
  FROM bookmarks b2 
  WHERE b2.id = bookmarks.id
);

-- Create an index on order_index for better performance when sorting
CREATE INDEX idx_bookmarks_order_index ON bookmarks(collection_id, order_index);

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookmarks' AND column_name = 'order_index';
