import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, extractTextFromBlockNote, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  currentPageId?: string;
}

interface RelevantPage {
  id: string;
  title: string;
  content: unknown;
  similarity: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: ChatRequest = await request.json();
    const { message, currentPageId } = body;

    // Get user settings
    const { data: settings } = await (supabase as any)
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const provider = (settings?.llm_provider as ProviderType) || 'openai';
    const model = settings?.llm_model || 'gpt-4';

    // Get API key
    const { data: keyData } = await (supabase as any)
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider === 'anthropic' ? 'anthropic' : 'openai')
      .single();

    const apiKey = keyData?.api_key;

    // For Ollama, we don't need API keys
    if (provider !== 'ollama' && !apiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key configured for ${provider}. Please add your API key in Settings.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create LLM provider
    const llmProvider = createLLMProvider({
      provider,
      apiKey,
      baseUrl: settings?.llm_base_url || undefined,
    });

    // Get OpenAI key for embeddings (required for RAG)
    let openaiKey = apiKey;
    if (provider !== 'openai') {
      const { data: oaiKeyData } = await (supabase as any)
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('provider', 'openai')
        .single();
      openaiKey = oaiKeyData?.api_key;
    }

    // Try to find relevant pages using embeddings (if OpenAI key available)
    let relevantPages: RelevantPage[] = [];
    let context = '';

    if (openaiKey) {
      try {
        // Generate embedding for query
        const embeddingProvider = createLLMProvider({
          provider: 'openai',
          apiKey: openaiKey,
        });
        const queryEmbedding = await embeddingProvider.embed(message);

        // Find relevant pages
        const { data: matchedPages } = await (supabase as any).rpc('match_pages', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          p_user_id: user.id,
        });

        if (matchedPages && matchedPages.length > 0) {
          relevantPages = matchedPages;

          // Build context from relevant pages
          context = relevantPages
            .map((p) => {
              const text = extractTextFromBlockNote(p.content);
              return `[${p.title}]:\n${text.substring(0, 800)}`;
            })
            .join('\n\n---\n\n');
        }
      } catch (error) {
        console.error('Error finding relevant pages:', error);
        // Continue without RAG context
      }
    }

    // If no RAG results, try to get current page context
    if (!context && currentPageId) {
      const { data: currentPage } = await supabase
        .from('pages')
        .select('id, title, content')
        .eq('id', currentPageId)
        .single();

      if (currentPage) {
        const text = extractTextFromBlockNote(currentPage.content);
        context = `[${currentPage.title}]:\n${text.substring(0, 1500)}`;
        relevantPages = [{ ...currentPage, similarity: 1.0 } as RelevantPage];
      }
    }

    // Build system prompt
    const systemPrompt = context
      ? `You are a helpful AI assistant with access to the user's notes and knowledge base.

Use the following context from the user's notes to answer questions. When referencing information from notes, cite the source using [Page Title] format.

If the context doesn't contain relevant information, say so and answer based on your general knowledge.

Context from user's notes:
${context}

Guidelines:
- Be concise and helpful
- Cite sources with [Page Title] when using information from notes
- If you're not sure about something, say so
- Format responses with markdown when appropriate`
      : `You are a helpful AI assistant. The user hasn't added any notes with relevant context yet, so answer based on your general knowledge.

Be concise and helpful. Format responses with markdown when appropriate.`;

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send relevant pages first
          if (relevantPages.length > 0) {
            const sourcesData = JSON.stringify({
              type: 'sources',
              pages: relevantPages.map((p) => ({ id: p.id, title: p.title })),
            });
            controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
          }

          // Stream AI response
          const responseStream = llmProvider.chatStream(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            { model, maxTokens: 2048 }
          );

          for await (const chunk of responseStream) {
            const data = JSON.stringify({ type: 'content', text: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          const errorData = JSON.stringify({ type: 'error', error: errorMsg });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
