/**
 * AI Image Generation API
 * Story: LORE-3.8 - Image Generation
 *
 * Generates images using DALL-E and saves to Supabase Storage
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImageRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
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

    const body: ImageRequest = await request.json();
    const { prompt, size = '1024x1024' } = body;

    if (!prompt || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Prompt is required (min 3 characters)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user settings
    const { data: settings } = await (supabase as any)
      .from('user_settings')
      .select('image_provider')
      .eq('user_id', user.id)
      .single();

    const imageProvider = settings?.image_provider || 'dalle';

    // Get OpenAI API key (required for DALL-E)
    const { data: keyData } = await (supabase as any)
      .from('user_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'openai')
      .single();

    const openaiKey = keyData?.api_key;

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key required for image generation. Please add your API key in Settings.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate image with DALL-E
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const dalleData = await dalleResponse.json();
    const imageUrl = dalleData.data[0].url;
    const revisedPrompt = dalleData.data[0].revised_prompt;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageBlob = await imageResponse.blob();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}/${timestamp}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filename, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, return the temporary URL
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({
          url: imageUrl, // Use the temporary DALL-E URL
          prompt: prompt,
          revisedPrompt: revisedPrompt,
          temporary: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    return new Response(
      JSON.stringify({
        url: publicUrlData.publicUrl,
        prompt: prompt,
        revisedPrompt: revisedPrompt,
        temporary: false,
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
