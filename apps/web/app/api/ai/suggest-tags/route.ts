/**
 * AI Tag Suggestion API
 * Story: LORE-3.7 - AI Auto-Tagging
 *
 * Analyzes page content and suggests relevant tags
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, extractTextFromBlockNote, type ProviderType } from '@lore/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SuggestTagsRequest {
  pageId: string;
  content: unknown;
}

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

    const body: SuggestTagsRequest = await request.json();
    const { pageId, content } = body;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Missing content' }), {
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

    // Extract text from BlockNote content
    const text = extractTextFromBlockNote(content);

    if (text.length < 50) {
      return new Response(
        JSON.stringify({
          suggestions: [],
          message: 'Content too short for tag suggestions',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing tags for context
    const { data: existingTags } = await (supabase as any)
      .from('tags')
      .select('name')
      .eq('user_id', user.id);

    const existingTagNames = existingTags?.map((t: { name: string }) => t.name) || [];

    // Generate tag suggestions
    const systemPrompt = `You are a tag suggestion assistant. Analyze the content and suggest 3-5 relevant tags.

Guidelines:
- Tags should be single words or short 2-3 word phrases
- Use lowercase only
- Be specific and descriptive
- Consider reusing existing tags when relevant

${existingTagNames.length > 0 ? `Existing tags the user has (prefer these when relevant): ${existingTagNames.join(', ')}` : ''}

Return ONLY a JSON array of suggested tags, nothing else.
Example: ["react", "web development", "hooks", "frontend"]`;

    const response = await llmProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text.substring(0, 2000) }, // Limit content
      ],
      { model, maxTokens: 256, temperature: 0.5 }
    );

    // Parse the response
    let suggestions: string[] = [];
    try {
      const content = response.content.trim();
      // Try to parse as JSON, handling various formats
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, try to extract tags from comma-separated or newline format
      suggestions = response.content
        .replace(/[\[\]"']/g, '')
        .split(/[,\n]/)
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && t.length < 50);
    }

    // Clean and limit suggestions
    suggestions = suggestions
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length >= 2 && t.length < 50)
      .slice(0, 5);

    // Mark which are existing vs new
    const tagSuggestions = suggestions.map(name => ({
      name,
      isExisting: existingTagNames.includes(name),
    }));

    return new Response(
      JSON.stringify({ suggestions: tagSuggestions }),
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
