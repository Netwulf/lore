/**
 * AI Inline Actions API
 * Story: LORE-3.6 - AI Inline Actions
 *
 * Handles expand, summarize, and rewrite actions on selected text
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InlineAction = 'expand' | 'summarize' | 'rewrite';

interface InlineRequest {
  action: InlineAction;
  text: string;
}

const SYSTEM_PROMPTS: Record<InlineAction, string> = {
  expand: `You are a writing assistant. Expand the following text with more detail, examples, and explanations.
Maintain the original tone, style, and voice. Add relevant context and elaboration.
Return ONLY the expanded text, no explanations or meta-commentary.`,

  summarize: `You are a writing assistant. Summarize the following text concisely while keeping the key points.
Aim for about 30-40% of the original length. Preserve the most important information.
Return ONLY the summarized text, no explanations or meta-commentary.`,

  rewrite: `You are a writing assistant. Rewrite the following text to be clearer, more engaging, and better structured.
Maintain the original meaning and key information. Improve flow and readability.
Return ONLY the rewritten text, no explanations or meta-commentary.`,
};

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

    const body: InlineRequest = await request.json();
    const { action, text } = body;

    if (!action || !text) {
      return new Response(JSON.stringify({ error: 'Missing action or text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!SYSTEM_PROMPTS[action]) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // Generate the response
    const response = await llmProvider.chat(
      [
        { role: 'system', content: SYSTEM_PROMPTS[action] },
        { role: 'user', content: text },
      ],
      { model, maxTokens: 2048, temperature: 0.7 }
    );

    return new Response(
      JSON.stringify({
        result: response.content,
        action,
        originalLength: text.length,
        resultLength: response.content.length,
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
