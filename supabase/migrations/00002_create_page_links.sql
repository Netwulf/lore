-- Migration: Create page_links table
-- Created: 2025-12-29
-- Description: Stores bidirectional links between pages for backlinks and graph

-- Page links table
CREATE TABLE IF NOT EXISTS page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate links between same pages
  UNIQUE(source_id, target_id)
);

-- Enable RLS
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own links
CREATE POLICY "Users can CRUD own links"
ON page_links FOR ALL
USING (auth.uid() = user_id);

-- Indexes for fast queries
-- Source index for outgoing links
CREATE INDEX IF NOT EXISTS idx_page_links_source ON page_links(source_id);
-- Target index for backlinks (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_page_links_target ON page_links(target_id);
-- User index for RLS performance
CREATE INDEX IF NOT EXISTS idx_page_links_user ON page_links(user_id);

-- Comments
COMMENT ON TABLE page_links IS 'Stores wiki-style links between pages for backlinks and graph visualization';
COMMENT ON COLUMN page_links.source_id IS 'Page containing the link';
COMMENT ON COLUMN page_links.target_id IS 'Page being linked to';
