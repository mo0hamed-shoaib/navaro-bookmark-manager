-- Sharing table migration for view-only links
-- Run this in your Supabase SQL editor

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

-- Allow all operations for now (since we're using workspace-based access)
CREATE POLICY "Allow all operations on shares" ON shares FOR ALL USING (true);
