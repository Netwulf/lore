/**
 * LLM Provider Factory
 * Story: LORE-3.2 - LLM Provider Abstraction
 */

import type { LLMProvider, LLMConfig, ProviderType } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

export interface ProviderConfig {
  provider: ProviderType;
  apiKey?: string;
  openaiKey?: string; // For Anthropic embedding fallback
  baseUrl?: string;
}

/**
 * Create an LLM provider instance based on configuration
 */
export function createLLMProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required');
      }
      return new OpenAIProvider(config.apiKey, config.baseUrl);

    case 'anthropic':
      if (!config.apiKey) {
        throw new Error('Anthropic API key is required');
      }
      return new AnthropicProvider(config.apiKey, config.openaiKey);

    case 'ollama':
      return new OllamaProvider(config.baseUrl || 'http://localhost:11434');

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Create a provider from user settings
 */
export interface UserAISettings {
  llm_provider: string;
  llm_model?: string;
  llm_base_url?: string;
}

export interface UserAPIKeys {
  openai?: string;
  anthropic?: string;
}

export function createProviderFromSettings(
  settings: UserAISettings,
  apiKeys: UserAPIKeys
): LLMProvider {
  const provider = settings.llm_provider as ProviderType;

  switch (provider) {
    case 'openai':
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key not configured');
      }
      return new OpenAIProvider(apiKeys.openai, settings.llm_base_url);

    case 'anthropic':
      if (!apiKeys.anthropic) {
        throw new Error('Anthropic API key not configured');
      }
      return new AnthropicProvider(apiKeys.anthropic, apiKeys.openai);

    case 'ollama':
      return new OllamaProvider(
        settings.llm_base_url || 'http://localhost:11434'
      );

    default:
      // Default to OpenAI if available
      if (apiKeys.openai) {
        return new OpenAIProvider(apiKeys.openai);
      }
      throw new Error('No LLM provider configured');
  }
}
