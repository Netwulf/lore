import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createLLMProvider, type ProviderType } from '@lore/ai';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, model, baseUrl } = body as {
      provider: ProviderType;
      model: string;
      baseUrl?: string;
    };

    // For Ollama, we don't need API keys
    if (provider === 'ollama') {
      try {
        const ollamaProvider = createLLMProvider({
          provider: 'ollama',
          baseUrl: baseUrl || 'http://localhost:11434',
        });

        const response = await ollamaProvider.chat(
          [{ role: 'user', content: 'Say "Connection test successful" and nothing else.' }],
          { model, maxTokens: 50 }
        );

        return NextResponse.json({
          success: true,
          message: response.content,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
          success: false,
          error: `Ollama connection failed: ${message}`,
        });
      }
    }

    // For cloud providers, get API key from database
    const { data: keyData } = await (supabase as any)
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    const apiKey = (keyData as { api_key: string } | null)?.api_key;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: `No API key configured for ${provider}. Please add your API key first.`,
      });
    }

    // Create provider and test
    try {
      const llmProvider = createLLMProvider({
        provider,
        apiKey,
        baseUrl,
      });

      const response = await llmProvider.chat(
        [{ role: 'user', content: 'Say "Connection test successful" and nothing else.' }],
        { model, maxTokens: 50 }
      );

      return NextResponse.json({
        success: true,
        message: response.content,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({
        success: false,
        error: `Provider test failed: ${message}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
