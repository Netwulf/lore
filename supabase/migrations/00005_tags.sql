-- Migration: Tags System
-- Story: LORE-3.7 - AI Auto-Tagging
--
-- Creates tags and page_tags tables for organizing pages with AI-suggested tags

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  color TEXT DEFAULT '#8dc75e', -- Tech Olive default
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Page-Tags junction table
CREATE TABLE IF NOT EXISTS page_tags (
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (page_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_page_tags_page_id ON page_tags(page_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_tag_id ON page_tags(tag_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for page_tags
CREATE POLICY "Users can view own page_tags"
  ON page_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own page_tags"
  ON page_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own page_tags"
  ON page_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_tags.page_id
      AND pages.user_id = auth.uid()
    )
  );

-- Function to get tag counts
CREATE OR REPLACE FUNCTION get_tags_with_counts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  page_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.color,
    COUNT(pt.page_id)::BIGINT as page_count
  FROM tags t
  LEFT JOIN page_tags pt ON pt.tag_id = t.id
  WHERE t.user_id = p_user_id
  GROUP BY t.id, t.name, t.color
  ORDER BY page_count DESC, t.name ASC;
END;
$$;

-- Function to get pages by tag
CREATE OR REPLACE FUNCTION get_pages_by_tag(p_tag_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  parent_id UUID,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.parent_id,
    p.updated_at
  FROM pages p
  INNER JOIN page_tags pt ON pt.page_id = p.id
  WHERE pt.tag_id = p_tag_id
    AND p.user_id = p_user_id
  ORDER BY p.updated_at DESC;
END;
$$;
