/**
 * OpenAI Provider Implementation
 * Story: LORE-3.2 - LLM Provider Abstraction
 */

import OpenAI from 'openai';
import type {
  LLMProvider,
  LLMMessage,
  LLMResponse,
  ChatOptions,
  EmbeddingOptions,
} from '../types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  readonly name = 'openai';

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });
  }

  async chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP,
      frequency_penalty: options?.frequencyPenalty,
      presence_penalty: options?.presencePenalty,
      stop: options?.stop,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      model: response.model,
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *chatStream(
    messages: LLMMessage[],
    options?: ChatOptions
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: options?.model || 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }
}
