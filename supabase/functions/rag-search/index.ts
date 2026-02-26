// Supabase Edge Function: rag-search
// Deploy with: supabase functions deploy rag-search
// Requires: GEMINI_API_KEY secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query } = await req.json()

        if (!query) {
            return new Response(
                JSON.stringify({ error: 'query is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Generate embedding for the query using Gemini
        const embedResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'models/text-embedding-004',
                    content: { parts: [{ text: query }] },
                    taskType: 'RETRIEVAL_QUERY',
                }),
            }
        )

        if (!embedResponse.ok) {
            console.error('Embedding error:', await embedResponse.text())
            return new Response(
                JSON.stringify({ error: 'Failed to generate embedding' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const embedData = await embedResponse.json()
        const embedding = embedData.embedding?.values

        if (!embedding) {
            return new Response(
                JSON.stringify({ error: 'No embedding returned' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Search regulation_chunks using cosine similarity
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Use RPC for vector search (or raw SQL)
        const { data: chunks, error: searchError } = await supabase.rpc('match_regulations', {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
        })

        if (searchError) {
            console.error('Search error:', searchError)
            // Fallback to text search if vector search isn't set up yet
            const { data: textResults } = await supabase
                .from('regulation_chunks')
                .select('source, section, content')
                .textSearch('content', query.split(' ').join(' & '))
                .limit(5)

            return new Response(
                JSON.stringify({
                    results: (textResults || []).map(r => ({
                        source: r.source,
                        section: r.section,
                        content: r.content,
                    })),
                    search_type: 'text_fallback',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                results: (chunks || []).map((r: { source: string; section: string; content: string; similarity: number }) => ({
                    source: r.source,
                    section: r.section,
                    content: r.content,
                    relevance: Math.round(r.similarity * 100),
                })),
                search_type: 'vector',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('RAG search error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
