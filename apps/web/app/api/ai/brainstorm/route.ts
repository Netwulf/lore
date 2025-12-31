/**
 * AI Brainstorm API
 * Story: LORE-5.1 - Expand AI Slash Commands
 *
 * Generates ideas based on topic or context
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BrainstormRequest {
  topic?: string;
  context?: string;
  pageTitle?: string;
}

const SYSTEM_PROMPT = `You are a creative brainstorming assistant.

Generate 5-7 unique ideas related to the given topic or context.
Each idea should be actionable and specific.

Format your response as a numbered list:
1. **Idea Title** - Brief description of the idea
2. **Idea Title** - Brief description of the idea
...

Guidelines:
- Be creative and think outside the box
- Make ideas specific and actionable
- Vary the types of ideas (some safe, some bold)
- Keep descriptions concise (1-2 sentences each)
- Don't repeat similar ideas`;

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

    const body: BrainstormRequest = await request.json();
    const { topic, context, pageTitle } = body;

    if (!topic && !context) {
      return new Response(
        JSON.stringify({ error: 'Please provide a topic or some context to brainstorm about' }),
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

    // Build user prompt
    let userPrompt = '';
    if (topic) {
      userPrompt = `Brainstorm ideas about: ${topic}`;
    } else if (context) {
      userPrompt = pageTitle
        ? `Based on this content from "${pageTitle}":\n\n${context.slice(0, 1000)}\n\nBrainstorm related ideas:`
        : `Based on this content:\n\n${context.slice(0, 1000)}\n\nBrainstorm related ideas:`;
    }

    // Generate response
    const response = await llmProvider.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { model, maxTokens: 1024, temperature: 0.8 }
    );

    return new Response(
      JSON.stringify({
        ideas: response.content,
        topic: topic || pageTitle || 'Context-based',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
