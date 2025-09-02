-- ========================================
-- TOBY BOOKMARK MANAGER - FINAL DATABASE SETUP
-- ========================================
-- 
-- This is the ONE script you need to run to set up your complete database.
-- Run this in your Supabase SQL Editor to create everything from scratch.
-- 
-- Features included:
-- ✅ Complete database schema with all tables
-- ✅ All necessary indexes and constraints
-- ✅ Row Level Security (RLS) policies
-- ✅ Automatic timestamp updates
-- ✅ Sample data for testing
-- ✅ All latest features (sharing, sessions, order indexing, etc.)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. CORE TABLES
-- ========================================

-- Workspaces (magic link system)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY, -- Custom workspace ID for magic links (e.g., w_abc123)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spaces (high-level organization)
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections (within spaces) - CORRECTED: Only supports grid, grid2, compact, list
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  view_mode TEXT DEFAULT 'grid' CHECK (view_mode IN ('grid', 'grid2', 'compact', 'list')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks (within collections) - INCLUDES order_index for drag & drop
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  preview JSONB, -- {title, description, image}
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0, -- CRITICAL: This enables drag & drop reordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. SHARING SYSTEM - COMPLETE with ALL columns
-- ========================================

-- Sharing (view-only links) - COMPLETE: Includes name, description, and expires_at
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  view_key TEXT UNIQUE NOT NULL,
  name TEXT, -- CRITICAL: Was missing from original
  description TEXT, -- CRITICAL: Was missing from original
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- CRITICAL: Was missing from original
);

-- ========================================
-- 3. SESSIONS SYSTEM - CORRECTED: Uses UUID not VARCHAR
-- ========================================

-- Sessions (for tab management) - CORRECTED: Uses UUID instead of VARCHAR
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- CORRECTED: Was VARCHAR in original
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- CORRECTED: Was TIMESTAMP in original
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- CORRECTED: Was TIMESTAMP in original
);

-- Session tabs - CORRECTED: Uses UUID not VARCHAR
CREATE TABLE IF NOT EXISTS session_tabs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- CORRECTED: Was VARCHAR in original
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, -- CORRECTED: Was VARCHAR in original
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  favicon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- CORRECTED: Was TIMESTAMP in original
);

-- ========================================
-- 4. INDEXES FOR PERFORMANCE - COMPLETE from all sources
-- ========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_spaces_workspace_id ON spaces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_spaces_order ON spaces(workspace_id, order_index);
CREATE INDEX IF NOT EXISTS idx_collections_space_id ON collections(space_id);
CREATE INDEX IF NOT EXISTS idx_collections_order ON collections(space_id, order_index);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_pinned ON bookmarks(collection_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_order_index ON bookmarks(collection_id, order_index); -- CRITICAL: For drag & drop performance

-- Sharing indexes - COMPLETE: Includes all from original schema
CREATE INDEX IF NOT EXISTS idx_shares_workspace_id ON shares(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shares_view_key ON shares(view_key);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at); -- CRITICAL: For expiring shares

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_id ON sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_session_tabs_session_id ON session_tabs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tabs_order_index ON session_tabs(order_index);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_search ON bookmarks USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || url));
CREATE INDEX IF NOT EXISTS idx_collections_search ON collections USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_spaces_search ON spaces USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies (magic link system - allow all operations)
DO $$
BEGIN
  -- Workspaces
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Allow all operations on workspaces') THEN
    CREATE POLICY "Allow all operations on workspaces" ON workspaces FOR ALL USING (true);
  END IF;
  
  -- Spaces
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spaces' AND policyname = 'Allow all operations on spaces') THEN
    CREATE POLICY "Allow all operations on spaces" ON spaces FOR ALL USING (true);
  END IF;
  
  -- Collections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow all operations on collections') THEN
    CREATE POLICY "Allow all operations on collections" ON collections FOR ALL USING (true);
  END IF;
  
  -- Bookmarks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Allow all operations on bookmarks') THEN
    CREATE POLICY "Allow all operations on bookmarks" ON bookmarks FOR ALL USING (true);
  END IF;
  
  -- Shares
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shares' AND policyname = 'Allow all operations on shares') THEN
    CREATE POLICY "Allow all operations on shares" ON shares FOR ALL USING (true);
  END IF;
  
  -- Sessions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow all operations on sessions') THEN
    CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
  END IF;
  
  -- Session tabs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_tabs' AND policyname = 'Allow all operations on session_tabs') THEN
    CREATE POLICY "Allow all operations on session_tabs" ON session_tabs FOR ALL USING (true);
  END IF;
END $$;

-- ========================================
-- 6. AUTOMATIC TIMESTAMP UPDATES
-- ========================================

-- Function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DO $$
BEGIN
  -- Workspaces trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workspaces_updated_at') THEN
    CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Spaces trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_spaces_updated_at') THEN
    CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Collections trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_collections_updated_at') THEN
    CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Bookmarks trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookmarks_updated_at') THEN
    CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Sessions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ========================================
-- 7. UTILITY FUNCTIONS
-- ========================================

-- Function to generate view keys for sharing
CREATE OR REPLACE FUNCTION generate_view_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'view_' || substr(md5(random()::text), 1, 16);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample data only if no data exists
DO $$
DECLARE
    workspace_count INTEGER;
    workspace_id TEXT;
    space_design_id UUID;
    space_work_id UUID;
    space_learn_id UUID;
    collection_design_id UUID;
    collection_work_id UUID;
    collection_learn_id UUID;
BEGIN
    -- Check if we already have data
    SELECT COUNT(*) INTO workspace_count FROM workspaces;
    
    -- Only insert sample data if no workspaces exist
    IF workspace_count = 0 THEN
        -- Create a new workspace and capture its ID
        INSERT INTO workspaces (id) VALUES ('default-workspace') RETURNING id INTO workspace_id;
        
        -- Insert spaces and capture their IDs
        INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
          ('default-workspace', 'Design Resources', 'A curated collection of design tools, inspiration, and resources', '🎨', 1)
        RETURNING id INTO space_design_id;
        
        INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
          ('default-workspace', 'Work Tools', 'Essential tools for daily work', '⚡', 2)
        RETURNING id INTO space_work_id;
        
        INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
          ('default-workspace', 'Learning Resources', 'Educational content and tutorials', '📚', 3)
        RETURNING id INTO space_learn_id;
        
        -- Insert collections and capture their IDs - CORRECTED: Uses 'grid' not 'card'
        INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
          (space_design_id, 'Design Tools', 'Essential design applications', '🎨', 1, 'grid')
        RETURNING id INTO collection_design_id;
        
        INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
          (space_work_id, 'Productivity', 'Tools to boost productivity', '⚡', 1, 'list')
        RETURNING id INTO collection_work_id;
        
        INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
          (space_learn_id, 'Documentation', 'Technical documentation and guides', '📚', 1, 'compact')
        RETURNING id INTO collection_learn_id;
        
        -- Insert bookmarks with proper order_index (CRITICAL: This enables drag & drop)
        INSERT INTO bookmarks (collection_id, title, url, description, favicon, tags, is_pinned, order_index) VALUES 
          (collection_design_id, 'Figma', 'https://figma.com', 'Collaborative design platform for teams', 'https://static.figma.com/app/icon/1/favicon.png', ARRAY['design', 'collaboration', 'ui'], true, 0),
          (collection_work_id, 'GitHub', 'https://github.com', 'Version control and collaboration platform', 'https://github.githubassets.com/favicons/favicon.png', ARRAY['development', 'git', 'collaboration'], true, 0),
          (collection_learn_id, 'MDN Web Docs', 'https://developer.mozilla.org', 'Comprehensive web development documentation', 'https://developer.mozilla.org/favicon-48x48.png', ARRAY['documentation', 'web', 'learning'], false, 0);
        
        RAISE NOTICE 'Sample data inserted successfully!';
    ELSE
        RAISE NOTICE 'Sample data already exists, skipping insertion.';
    END IF;
END $$;

-- ========================================
-- 9. VERIFICATION
-- ========================================

-- Verify all tables were created successfully
SELECT 
  'workspaces' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') as exists
UNION ALL
SELECT 
  'spaces' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spaces') as exists
UNION ALL
SELECT 
  'collections' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') as exists
UNION ALL
SELECT 
  'bookmarks' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookmarks') as exists
UNION ALL
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

-- ========================================
-- SETUP COMPLETE! 🎉
-- ========================================
--
-- Your Toby Bookmark Manager database is now ready!
-- 
-- What was created:
-- ✅ Complete database schema with all tables
-- ✅ All necessary indexes for performance
-- ✅ Row Level Security policies
-- ✅ Automatic timestamp updates
-- ✅ Sample data for testing
-- ✅ Sharing system for public links (with expiration)
-- ✅ Sessions system for tab management
-- ✅ Order indexing for drag & drop (CRITICAL FEATURE)
-- ✅ Full-text search capabilities
-- ✅ All view modes: grid, grid2, compact, list
-- ✅ Complete shares table with name, description, expires_at
-- ✅ Proper UUID types for sessions (not VARCHAR)
--
-- Next steps:
-- 1. Update your environment variables with Supabase credentials
-- 2. Deploy your app
-- 3. Start using your bookmark manager!
-- ========================================
