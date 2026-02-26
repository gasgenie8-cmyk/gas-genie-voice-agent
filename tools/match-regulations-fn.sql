-- PostgreSQL function for vector similarity search
-- Run this in Supabase SQL Editor after enabling pgvector

CREATE OR REPLACE FUNCTION match_regulations(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source text,
  section text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    regulation_chunks.id,
    regulation_chunks.source,
    regulation_chunks.section,
    regulation_chunks.content,
    1 - (regulation_chunks.embedding <=> query_embedding) AS similarity
  FROM regulation_chunks
  WHERE 1 - (regulation_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY regulation_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;
