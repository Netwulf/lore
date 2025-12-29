-- Migration: Enable pgvector and create embeddings infrastructure
-- Story: LORE-3.1 - Embeddings Infrastructure

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create ivfflat index for similarity search (requires at least 100 rows for lists=100)
-- Using a smaller lists value initially, can be rebuilt with more data
CREATE INDEX IF NOT EXISTS pages_embedding_idx
ON pages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Chunks table for long pages (>1000 tokens)
CREATE TABLE IF NOT EXISTS page_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, chunk_index)
);

-- Index for chunk embeddings
CREATE INDEX IF NOT EXISTS page_chunks_embedding_idx
ON page_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Index for looking up chunks by page
CREATE INDEX IF NOT EXISTS page_chunks_page_id_idx ON page_chunks(page_id);

-- RLS for page_chunks
ALTER TABLE page_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own page chunks"
ON page_chunks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page chunks"
ON page_chunks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own page chunks"
ON page_chunks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own page chunks"
ON page_chunks FOR DELETE
USING (auth.uid() = user_id);

-- Function to search pages by embedding similarity
CREATE OR REPLACE FUNCTION match_pages(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    1 - (p.embedding <=> query_embedding) as similarity
  FROM pages p
  WHERE (p_user_id IS NULL OR p.user_id = p_user_id)
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search chunks by embedding similarity
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chunk_id uuid,
  page_id uuid,
  page_title text,
  chunk_content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as chunk_id,
    c.page_id,
    p.title as page_title,
    c.content as chunk_content,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM page_chunks c
  JOIN pages p ON p.id = c.page_id
  WHERE (p_user_id IS NULL OR c.user_id = p_user_id)
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- User settings table for LLM configuration
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  llm_provider TEXT DEFAULT 'openai',
  llm_model TEXT DEFAULT 'gpt-4',
  llm_base_url TEXT,
  embedding_provider TEXT DEFAULT 'openai',
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  image_provider TEXT DEFAULT 'dalle',
  image_model TEXT DEFAULT 'dall-e-3',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table (stored separately for security)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- RLS for user_api_keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
ON user_api_keys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
ON user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
ON user_api_keys FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
ON user_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Update timestamp trigger for user_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
BEFORE UPDATE ON user_api_keys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
