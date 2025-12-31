/**
 * AI Translate API
 * Story: LORE-5.1 - Expand AI Slash Commands
 *
 * Translates text to specified language
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

const SUPPORTED_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi',
  'Dutch', 'Swedish', 'Polish', 'Turkish', 'Vietnamese', 'Thai',
  'Indonesian', 'Greek', 'Hebrew', 'Czech', 'Romanian', 'Hungarian'
];

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

    const body: TranslateRequest = await request.json();
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing text or target language' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate language
    const normalizedLang = SUPPORTED_LANGUAGES.find(
      (l) => l.toLowerCase() === targetLanguage.toLowerCase()
    );

    if (!normalizedLang) {
      return new Response(
        JSON.stringify({
          error: `Unsupported language: ${targetLanguage}`,
          supportedLanguages: SUPPORTED_LANGUAGES,
        }),
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

    const systemPrompt = `You are a professional translator.
Translate the following text to ${normalizedLang}.

Guidelines:
- Maintain the original meaning and tone
- Keep formatting (markdown, lists, etc.)
- Preserve proper nouns and technical terms when appropriate
- Return ONLY the translated text, no explanations`;

    // Generate translation
    const response = await llmProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { model, maxTokens: 2048, temperature: 0.3 }
    );

    return new Response(
      JSON.stringify({
        translation: response.content,
        targetLanguage: normalizedLang,
        originalLength: text.length,
        translatedLength: response.content.length,
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

// GET endpoint to list supported languages
export async function GET() {
  return new Response(
    JSON.stringify({ languages: SUPPORTED_LANGUAGES }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
