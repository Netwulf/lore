/**
 * AI Continue Writing API
 * Story: LORE-5.1 - Expand AI Slash Commands
 *
 * Continues writing from the current context
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ContinueRequest {
  context: string; // Text before cursor
  pageTitle?: string;
}

const SYSTEM_PROMPT = `You are a writing assistant helping to continue a document.

Based on the context provided, continue writing in the same style, tone, and format.
Write 2-3 paragraphs that naturally flow from the existing content.

Guidelines:
- Match the existing writing style
- Maintain the same level of formality
- Keep the same topic focus
- Use similar sentence structure
- Don't repeat what was already written
- Don't add meta-commentary like "Here's the continuation..."

Return ONLY the continuation text, nothing else.`;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: ContinueRequest = await request.json();
    const { context, pageTitle } = body;

    if (!context || context.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Need more context to continue writing (at least 10 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Build user prompt with context
    const userPrompt = pageTitle
      ? `Page: "${pageTitle}"\n\nContinue from:\n\n${context.slice(-1500)}`
      : `Continue from:\n\n${context.slice(-1500)}`;

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = llmProvider.chatStream(
            [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            { model, maxTokens: 1024, temperature: 0.7 }
          );

          for await (const chunk of responseStream) {
            const data = JSON.stringify({ type: 'content', text: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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
