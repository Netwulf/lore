import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, extractTextFromBlockNote } from '@lore/ai';

export const runtime = 'nodejs';

interface SearchResult {
  id: string;
  title: string;
  preview: string;
  similarity: number | null;
  isSemanticResult: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = (await request.json()) as { query: string };

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Try to get OpenAI key for embeddings
    const { data: keyData } = await (supabase as any)
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single();

    const openaiKey = keyData?.api_key;

    let results: SearchResult[] = [];
    let isSemanticSearch = false;

    // Try semantic search if OpenAI key available
    if (openaiKey) {
      try {
        const provider = createLLMProvider({
          provider: 'openai',
          apiKey: openaiKey,
        });

        // Generate query embedding
        const queryEmbedding = await provider.embed(query);

        // Search using match_pages RPC
        const { data: matchedPages, error: rpcError } = await (
          supabase as any
        ).rpc('match_pages', {
          query_embedding: queryEmbedding,
          match_threshold: 0.4,
          match_count: 10,
          p_user_id: user.id,
        });

        if (!rpcError && matchedPages && matchedPages.length > 0) {
          isSemanticSearch = true;
          results = matchedPages.map(
            (p: {
              id: string;
              title: string;
              content: unknown;
              similarity: number;
            }) => ({
              id: p.id,
              title: p.title,
              preview: extractTextFromBlockNote(p.content).substring(0, 200),
              similarity: Math.round(p.similarity * 100),
              isSemanticResult: true,
            })
          );
        }
      } catch (error) {
        console.error('Semantic search error:', error);
        // Fall through to text search
      }
    }

    // Fallback to text search
    if (results.length === 0) {
      const { data: textResults } = await supabase
        .from('pages')
        .select('id, title, content')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%`)
        .limit(10);

      if (textResults) {
        results = textResults.map((p) => ({
          id: p.id,
          title: p.title,
          preview: extractTextFromBlockNote(p.content).substring(0, 200),
          similarity: null,
          isSemanticResult: false,
        }));
      }
    }

    return NextResponse.json({
      results,
      isSemanticSearch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
