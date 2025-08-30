-- Comprehensive migration script for Toby Bookmark Manager
-- Run this in your Supabase SQL editor
-- This script is safe to run multiple times

-- ========================================
-- 1. SHARES TABLE (for view-only sharing)
-- ========================================

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  view_key TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shares_workspace_id ON shares(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shares_view_key ON shares(view_key);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

-- Add RLS policies for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shares' 
    AND policyname = 'Allow all operations on shares'
  ) THEN
    CREATE POLICY "Allow all operations on shares" ON shares FOR ALL USING (true);
  END IF;
END $$;

-- ========================================
-- 2. UPDATE COLLECTIONS VIEW MODE
-- ========================================

-- Update the check constraint to include 'grid2'
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'collections_view_mode_check' 
    AND table_name = 'collections'
  ) THEN
    ALTER TABLE collections DROP CONSTRAINT collections_view_mode_check;
  END IF;
  
  -- Add new constraint with grid2 support
  ALTER TABLE collections ADD CONSTRAINT collections_view_mode_check
    CHECK (view_mode IN ('card', 'compact', 'list', 'grid', 'grid2'));
    
  -- Update existing 'card' values to 'grid' for consistency
  UPDATE collections SET view_mode = 'grid' WHERE view_mode = 'card';
  
  -- Set default to 'grid' instead of 'card'
  ALTER TABLE collections ALTER COLUMN view_mode SET DEFAULT 'grid';
END $$;

-- ========================================
-- 3. SESSIONS TABLE (if not exists)
-- ========================================

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create session_tabs table if it doesn't exist
CREATE TABLE IF NOT EXISTS session_tabs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_session_tabs_session_id ON session_tabs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tabs_order_index ON session_tabs(order_index);

-- Enable RLS for sessions tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Sessions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Allow all operations on sessions'
  ) THEN
    CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
  END IF;
  
  -- Session tabs policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_tabs' 
    AND policyname = 'Allow all operations on session_tabs'
  ) THEN
    CREATE POLICY "Allow all operations on session_tabs" ON session_tabs FOR ALL USING (true);
  END IF;
END $$;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify tables exist
SELECT 
  'shares' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shares') as exists
UNION ALL
SELECT 
  'sessions' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') as exists
UNION ALL
SELECT 
  'session_tabs' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_tabs') as exists;
