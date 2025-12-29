/**
 * LLM Provider Abstraction Types
 * Story: LORE-3.2 - LLM Provider Abstraction
 */

export type MessageRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: MessageRole;
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface EmbeddingOptions {
  model?: string;
}

export interface LLMProvider {
  /**
   * Generate a chat completion
   */
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<LLMResponse>;

  /**
   * Generate a streaming chat completion
   */
  chatStream(messages: LLMMessage[], options?: ChatOptions): AsyncIterable<string>;

  /**
   * Generate an embedding for text
   */
  embed(text: string, options?: EmbeddingOptions): Promise<number[]>;

  /**
   * Get provider name
   */
  readonly name: string;
}

export type ProviderType = 'openai' | 'anthropic' | 'ollama';

export interface LLMConfig {
  provider: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  embeddingModel?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
}

// Default models by provider
export const DEFAULT_MODELS: Record<ProviderType, string> = {
  openai: 'gpt-4',
  anthropic: 'claude-3-sonnet-20240229',
  ollama: 'llama3',
};

export const DEFAULT_EMBEDDING_MODELS: Record<ProviderType, string> = {
  openai: 'text-embedding-ada-002',
  anthropic: 'text-embedding-ada-002', // Falls back to OpenAI
  ollama: 'nomic-embed-text',
};

export const MODEL_OPTIONS: Record<ProviderType, string[]> = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022',
  ],
  ollama: ['llama3', 'llama3.1', 'mistral', 'mixtral', 'codellama', 'gemma'],
};
