-- Check bookmarks and their collection_id values
SELECT 
  id, 
  title, 
  collection_id, 
  order_index,
  created_at
FROM bookmarks 
ORDER BY collection_id, order_index;

-- Check if there are any bookmarks without collection_id
SELECT COUNT(*) as bookmarks_without_collection
FROM bookmarks 
WHERE collection_id IS NULL;

-- Check collection_id values
SELECT DISTINCT collection_id 
FROM bookmarks 
WHERE collection_id IS NOT NULL
ORDER BY collection_id;
