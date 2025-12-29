-- Migration: Create suggestion functions and dismissed suggestions tracking
-- Created: 2025-12-29
-- Story: LORE-2.4 - Auto-Suggestion of Connections

-- Table to track dismissed suggestions per user
CREATE TABLE IF NOT EXISTS dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  suggested_page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, suggested_page_id, user_id)
);

-- Enable RLS
ALTER TABLE dismissed_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own dismissed suggestions
CREATE POLICY "Users can CRUD own dismissed suggestions"
ON dismissed_suggestions FOR ALL
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_dismissed_suggestions_page ON dismissed_suggestions(page_id, user_id);

-- Function: Get co-linked pages (pages that share common link targets)
-- This finds pages that are linked to by the same sources, suggesting a thematic connection
CREATE OR REPLACE FUNCTION get_co_linked_pages(p_page_id UUID, p_user_id UUID)
RETURNS TABLE(id UUID, title TEXT, score BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.title::TEXT,
    COUNT(*)::BIGINT as score
  FROM page_links l1
  -- Find pages that link to the current page
  JOIN page_links l2 ON l1.source_id = l2.source_id
    AND l1.target_id != l2.target_id
  -- Get the other pages they link to
  JOIN pages p ON l2.target_id = p.id
  WHERE l1.target_id = p_page_id
    AND p.user_id = p_user_id
    AND p.id != p_page_id
    -- Exclude already linked pages
    AND NOT EXISTS (
      SELECT 1 FROM page_links existing
      WHERE existing.source_id = p_page_id
        AND existing.target_id = p.id
    )
    -- Exclude dismissed suggestions
    AND NOT EXISTS (
      SELECT 1 FROM dismissed_suggestions ds
      WHERE ds.page_id = p_page_id
        AND ds.suggested_page_id = p.id
        AND ds.user_id = p_user_id
    )
  GROUP BY p.id, p.title
  ORDER BY score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get similar title pages using trigram similarity
-- Note: Requires pg_trgm extension to be enabled
CREATE OR REPLACE FUNCTION get_similar_title_pages(p_page_id UUID, p_page_title TEXT, p_user_id UUID)
RETURNS TABLE(id UUID, title TEXT, similarity REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title::TEXT,
    similarity(p.title, p_page_title) as sim
  FROM pages p
  WHERE p.user_id = p_user_id
    AND p.id != p_page_id
    AND similarity(p.title, p_page_title) > 0.1
    -- Exclude already linked pages
    AND NOT EXISTS (
      SELECT 1 FROM page_links existing
      WHERE existing.source_id = p_page_id
        AND existing.target_id = p.id
    )
    -- Exclude dismissed suggestions
    AND NOT EXISTS (
      SELECT 1 FROM dismissed_suggestions ds
      WHERE ds.page_id = p_page_id
        AND ds.suggested_page_id = p.id
        AND ds.user_id = p_user_id
    )
  ORDER BY sim DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE dismissed_suggestions IS 'Tracks which connection suggestions a user has dismissed';
COMMENT ON FUNCTION get_co_linked_pages IS 'Returns pages that share common link sources with the target page';
COMMENT ON FUNCTION get_similar_title_pages IS 'Returns pages with similar titles using trigram matching';
