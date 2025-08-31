-- Remove session-related tables from database
-- This script removes all session functionality

-- First, drop session_tabs table (due to foreign key constraint)
DROP TABLE IF EXISTS session_tabs;

-- Then drop sessions table
DROP TABLE IF EXISTS sessions;

-- Verify tables are removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'session_tabs');
