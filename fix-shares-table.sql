-- Fix shares table structure
-- Run this in your Supabase SQL editor

-- First, let's check the current structure of the shares table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shares' 
ORDER BY ordinal_position;

-- Drop the existing shares table if it exists (since it might have wrong structure)
DROP TABLE IF EXISTS shares CASCADE;

-- Recreate the shares table with the correct structure
CREATE TABLE shares (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  view_key TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_shares_workspace_id ON shares(workspace_id);
CREATE INDEX idx_shares_view_key ON shares(view_key);
CREATE INDEX idx_shares_expires_at ON shares(expires_at);

-- Add RLS policies for shares
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on shares" ON shares FOR ALL USING (true);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shares' 
ORDER BY ordinal_position;
