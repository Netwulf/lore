-- E5-S2: Optimized backlinks query to avoid N+1 problem
-- Instead of fetching full content for each backlink, we extract context server-side

CREATE OR REPLACE FUNCTION get_backlinks_with_context(p_page_id UUID)
RETURNS TABLE (
  source_id UUID,
  source_title TEXT,
  context_preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.source_id,
    p.title::TEXT,
    COALESCE(
      LEFT(
        -- Try to extract text from first paragraph block
        (p.content::jsonb -> 0 -> 'content' -> 0 ->> 'text'),
        100
      ),
      'Links to this page'
    ) as context_preview
  FROM page_links pl
  JOIN pages p ON p.id = pl.source_id
  WHERE pl.target_id = p_page_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION get_backlinks_with_context(UUID) TO authenticated;

COMMENT ON FUNCTION get_backlinks_with_context IS 'E5-S2: Fetch backlinks with server-side context extraction to avoid N+1 query problem';
