/**
 * Anthropic Provider Implementation
 * Story: LORE-3.2 - LLM Provider Abstraction
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  ChatOptions,
  EmbeddingOptions,
} from '../types';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private openaiKey?: string;
  readonly name = 'anthropic';

  constructor(apiKey: string, openaiKeyForEmbeddings?: string) {
    this.client = new Anthropic({ apiKey });
    this.openaiKey = openaiKeyForEmbeddings;
  }

  async chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options?.model || 'claude-3-sonnet-20240229',
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessage?.content,
      messages: otherMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      top_p: options?.topP,
      stop_sequences: options?.stop,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      content: textBlock?.type === 'text' ? textBlock.text : '',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model: response.model,
      finishReason: response.stop_reason || undefined,
    };
  }

  async *chatStream(
    messages: LLMMessage[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const stream = this.client.messages.stream({
      model: options?.model || 'claude-3-sonnet-20240229',
      max_tokens: options?.maxTokens ?? 2048,
      system: systemMessage?.content,
      messages: otherMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
    // Anthropic doesn't have embeddings API, use OpenAI fallback
    if (!this.openaiKey) {
      throw new Error(
        'Anthropic does not support embeddings. Provide OpenAI API key for embedding fallback.'
      );
    }

    // Dynamic import to avoid loading OpenAI if not needed
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: this.openaiKey });

    const response = await openai.embeddings.create({
      model: options?.model || 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }
}
