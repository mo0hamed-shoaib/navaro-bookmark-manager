-- Toby Bookmark Manager Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces (magic link system)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spaces (high-level organization)
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections (within spaces)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  view_mode TEXT DEFAULT 'card' CHECK (view_mode IN ('card', 'compact', 'list', 'grid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookmarks (within collections)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  preview JSONB, -- {title, description, image}
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sharing (view-only links)
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  view_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_spaces_workspace_id ON spaces(workspace_id);
CREATE INDEX idx_spaces_order ON spaces(workspace_id, order_index);
CREATE INDEX idx_collections_space_id ON collections(space_id);
CREATE INDEX idx_collections_order ON collections(space_id, order_index);
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX idx_bookmarks_pinned ON bookmarks(collection_id, is_pinned);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX idx_shares_view_key ON shares(view_key);

-- Full-text search indexes
CREATE INDEX idx_bookmarks_search ON bookmarks USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || url));
CREATE INDEX idx_collections_search ON collections USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_spaces_search ON spaces USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Row Level Security (RLS) policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Workspaces: Allow all operations (magic link system)
CREATE POLICY "Allow all operations on workspaces" ON workspaces
  FOR ALL USING (true);

-- Spaces: Allow all operations (magic link system)
CREATE POLICY "Allow all operations on spaces" ON spaces
  FOR ALL USING (true);

-- Collections: Allow all operations (magic link system)
CREATE POLICY "Allow all operations on collections" ON collections
  FOR ALL USING (true);

-- Bookmarks: Allow all operations (magic link system)
CREATE POLICY "Allow all operations on bookmarks" ON bookmarks
  FOR ALL USING (true);

-- Shares: Allow all operations (magic link system)
CREATE POLICY "Allow all operations on shares" ON shares
  FOR ALL USING (true);

-- Functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate view keys
CREATE OR REPLACE FUNCTION generate_view_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'view_' || substr(md5(random()::text), 1, 16);
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
-- Let the database generate proper UUIDs automatically
DO $$
DECLARE
    workspace_id UUID;
    space_design_id UUID;
    space_work_id UUID;
    space_learn_id UUID;
    collection_design_id UUID;
    collection_work_id UUID;
    collection_learn_id UUID;
BEGIN
    -- Create a new workspace and capture its ID
    INSERT INTO workspaces DEFAULT VALUES RETURNING id INTO workspace_id;
    
    -- Insert spaces and capture their IDs
    INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
      (workspace_id, 'Design Resources', 'A curated collection of design tools, inspiration, and resources', '🎨', 1)
    RETURNING id INTO space_design_id;
    
    INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
      (workspace_id, 'Work Tools', 'Essential tools for daily work', '⚡', 2)
    RETURNING id INTO space_work_id;
    
    INSERT INTO spaces (workspace_id, name, description, icon, order_index) VALUES 
      (workspace_id, 'Learning Resources', 'Educational content and tutorials', '📚', 3)
    RETURNING id INTO space_learn_id;
    
    -- Insert collections and capture their IDs
    INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
      (space_design_id, 'Design Tools', 'Essential design applications', '🎨', 1, 'card')
    RETURNING id INTO collection_design_id;
    
    INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
      (space_work_id, 'Productivity', 'Tools to boost productivity', '⚡', 1, 'list')
    RETURNING id INTO collection_work_id;
    
    INSERT INTO collections (space_id, name, description, icon, order_index, view_mode) VALUES 
      (space_learn_id, 'Documentation', 'Technical documentation and guides', '📚', 1, 'compact')
    RETURNING id INTO collection_learn_id;
    
    -- Insert bookmarks
    INSERT INTO bookmarks (collection_id, title, url, description, favicon, tags, is_pinned) VALUES 
      (collection_design_id, 'Figma', 'https://figma.com', 'Collaborative design platform for teams', 'https://static.figma.com/app/icon/1/favicon.png', ARRAY['design', 'collaboration', 'ui'], true),
      (collection_work_id, 'GitHub', 'https://github.com', 'Version control and collaboration platform', 'https://github.githubassets.com/favicons/favicon.png', ARRAY['development', 'git', 'collaboration'], true),
      (collection_learn_id, 'MDN Web Docs', 'https://developer.mozilla.org', 'Comprehensive web development documentation', 'https://developer.mozilla.org/favicon-48x48.png', ARRAY['documentation', 'web', 'learning'], false);
END $$;
