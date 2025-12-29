'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProviderType } from '@lore/ai';

export interface AISettings {
  llmProvider: ProviderType;
  llmModel: string;
  llmBaseUrl: string | null;
  embeddingProvider: ProviderType;
  embeddingModel: string;
  imageProvider: string;
  imageModel: string;
}

export interface APIKeys {
  openai: string | null;
  anthropic: string | null;
}

// Types for database rows (not in generated types yet)
interface UserSettingsRow {
  llm_provider: string;
  llm_model: string;
  llm_base_url: string | null;
  embedding_provider: string;
  embedding_model: string;
  image_provider: string;
  image_model: string;
}

interface UserApiKeyRow {
  provider: string;
  api_key: string;
}

const DEFAULT_SETTINGS: AISettings = {
  llmProvider: 'openai',
  llmModel: 'gpt-4',
  llmBaseUrl: null,
  embeddingProvider: 'openai',
  embeddingModel: 'text-embedding-ada-002',
  imageProvider: 'dalle',
  imageModel: 'dall-e-3',
};

export function useSettings() {
  const supabase = createClient();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [apiKeys, setApiKeys] = useState<APIKeys>({ openai: null, anthropic: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Load settings when userId is available
  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        // Load user settings (cast to any since table not in generated types)
        const { data: settingsData } = await (supabase as any)
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        const typedSettings = settingsData as UserSettingsRow | null;

        if (typedSettings) {
          setSettings({
            llmProvider: (typedSettings.llm_provider as ProviderType) || 'openai',
            llmModel: typedSettings.llm_model || 'gpt-4',
            llmBaseUrl: typedSettings.llm_base_url || null,
            embeddingProvider: (typedSettings.embedding_provider as ProviderType) || 'openai',
            embeddingModel: typedSettings.embedding_model || 'text-embedding-ada-002',
            imageProvider: typedSettings.image_provider || 'dalle',
            imageModel: typedSettings.image_model || 'dall-e-3',
          });
        }

        // Load API keys
        const { data: keysData } = await (supabase as any)
          .from('user_api_keys')
          .select('provider, api_key')
          .eq('user_id', userId);

        const typedKeys = keysData as UserApiKeyRow[] | null;

        if (typedKeys) {
          const keys: APIKeys = { openai: null, anthropic: null };
          for (const key of typedKeys) {
            if (key.provider === 'openai') keys.openai = key.api_key;
            if (key.provider === 'anthropic') keys.anthropic = key.api_key;
          }
          setApiKeys(keys);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId, supabase]);

  // Save settings
  const saveSettings = useCallback(
    async (newSettings: AISettings): Promise<boolean> => {
      if (!userId) return false;

      setSaving(true);
      try {
        const { error } = await (supabase as any).from('user_settings').upsert(
          {
            user_id: userId,
            llm_provider: newSettings.llmProvider,
            llm_model: newSettings.llmModel,
            llm_base_url: newSettings.llmBaseUrl,
            embedding_provider: newSettings.embeddingProvider,
            embedding_model: newSettings.embeddingModel,
            image_provider: newSettings.imageProvider,
            image_model: newSettings.imageModel,
          },
          { onConflict: 'user_id' }
        );

        if (error) throw error;

        setSettings(newSettings);
        return true;
      } catch (error) {
        console.error('Error saving settings:', error);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, supabase]
  );

  // Save API key
  const saveApiKey = useCallback(
    async (provider: 'openai' | 'anthropic', apiKey: string): Promise<boolean> => {
      if (!userId) return false;

      setSaving(true);
      try {
        const { error } = await (supabase as any).from('user_api_keys').upsert(
          {
            user_id: userId,
            provider,
            api_key: apiKey,
          },
          { onConflict: 'user_id,provider' }
        );

        if (error) throw error;

        setApiKeys((prev) => ({ ...prev, [provider]: apiKey }));
        return true;
      } catch (error) {
        console.error('Error saving API key:', error);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, supabase]
  );

  // Delete API key
  const deleteApiKey = useCallback(
    async (provider: 'openai' | 'anthropic'): Promise<boolean> => {
      if (!userId) return false;

      setSaving(true);
      try {
        const { error } = await (supabase as any)
          .from('user_api_keys')
          .delete()
          .eq('user_id', userId)
          .eq('provider', provider);

        if (error) throw error;

        setApiKeys((prev) => ({ ...prev, [provider]: null }));
        return true;
      } catch (error) {
        console.error('Error deleting API key:', error);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, supabase]
  );

  return {
    settings,
    apiKeys,
    loading,
    saving,
    saveSettings,
    saveApiKey,
    deleteApiKey,
  };
}

export default useSettings;
