-- Phase 2: Vision Diagnostics
-- Run this SQL in Supabase SQL Editor

-- Table for photo analysis results
CREATE TABLE IF NOT EXISTS photo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  photo_url TEXT NOT NULL,
  analysis JSONB,
  model_used TEXT DEFAULT 'gemini-2.0-flash',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_analyses" ON photo_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Phase 4: Regulation RAG (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS regulation_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  section TEXT,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regulation_chunks_embedding
  ON regulation_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Phase 6: Customer Portal
CREATE TABLE IF NOT EXISTS shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  engineer_id UUID REFERENCES profiles(id),
  document_type TEXT CHECK (document_type IN ('cp12', 'quote', 'invoice')),
  document_id UUID NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engineers_own_shares" ON shared_documents
  FOR ALL USING (auth.uid() = engineer_id);

-- Public read policy for shared docs (by token, no auth required)
CREATE POLICY "public_read_by_token" ON shared_documents
  FOR SELECT USING (true);
