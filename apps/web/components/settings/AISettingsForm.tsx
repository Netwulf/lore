'use client';

import { useState, useEffect } from 'react';
import { MODEL_OPTIONS, type ProviderType } from '@lore/ai';
import type { AISettings, APIKeys } from '@/lib/hooks/useSettings';

interface AISettingsFormProps {
  settings: AISettings;
  apiKeys: APIKeys;
  saving: boolean;
  onSaveSettings: (settings: AISettings) => Promise<boolean>;
  onSaveApiKey: (provider: 'openai' | 'anthropic', key: string) => Promise<boolean>;
  onDeleteApiKey: (provider: 'openai' | 'anthropic') => Promise<boolean>;
}

const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

export function AISettingsForm({
  settings,
  apiKeys,
  saving,
  onSaveSettings,
  onSaveApiKey,
  onDeleteApiKey,
}: AISettingsFormProps) {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Check for changes
  useEffect(() => {
    const changed =
      localSettings.llmProvider !== settings.llmProvider ||
      localSettings.llmModel !== settings.llmModel ||
      localSettings.llmBaseUrl !== settings.llmBaseUrl;
    setHasChanges(changed);
  }, [localSettings, settings]);

  const handleProviderChange = (provider: ProviderType) => {
    const models = MODEL_OPTIONS[provider] || [];
    setLocalSettings((prev) => ({
      ...prev,
      llmProvider: provider,
      llmModel: models[0] || '',
      llmBaseUrl: provider === 'ollama' ? 'http://localhost:11434' : null,
    }));
    setTestStatus('idle');
  };

  const handleModelChange = (model: string) => {
    setLocalSettings((prev) => ({ ...prev, llmModel: model }));
    setTestStatus('idle');
  };

  const handleBaseUrlChange = (url: string) => {
    setLocalSettings((prev) => ({ ...prev, llmBaseUrl: url || null }));
    setTestStatus('idle');
  };

  const handleSaveSettings = async () => {
    const success = await onSaveSettings(localSettings);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleSaveOpenaiKey = async () => {
    if (openaiKey.trim()) {
      const success = await onSaveApiKey('openai', openaiKey.trim());
      if (success) {
        setOpenaiKey('');
      }
    }
  };

  const handleSaveAnthropicKey = async () => {
    if (anthropicKey.trim()) {
      const success = await onSaveApiKey('anthropic', anthropicKey.trim());
      if (success) {
        setAnthropicKey('');
      }
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing connection...');

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localSettings.llmProvider,
          model: localSettings.llmModel,
          baseUrl: localSettings.llmBaseUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('Failed to test connection');
    }
  };

  const currentModels = MODEL_OPTIONS[localSettings.llmProvider] || [];

  return (
    <div className="space-y-8">
      {/* Text Provider Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-warm-ivory/80">Text Provider</h3>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-xs text-warm-ivory/50">Provider</label>
          <select
            value={localSettings.llmProvider}
            onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
            className="w-full px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 text-warm-ivory rounded focus:outline-none focus:border-tech-olive/50"
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-void-black">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="block text-xs text-warm-ivory/50">Model</label>
          <select
            value={localSettings.llmModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 text-warm-ivory rounded focus:outline-none focus:border-tech-olive/50"
          >
            {currentModels.map((model) => (
              <option key={model} value={model} className="bg-void-black">
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Base URL (for Ollama) */}
        {localSettings.llmProvider === 'ollama' && (
          <div className="space-y-2">
            <label className="block text-xs text-warm-ivory/50">Base URL</label>
            <input
              type="text"
              value={localSettings.llmBaseUrl || ''}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 text-warm-ivory rounded placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive/50"
            />
          </div>
        )}

        {/* Test Connection */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 text-sm bg-warm-ivory/10 text-warm-ivory rounded hover:bg-warm-ivory/20 transition-colors disabled:opacity-50"
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          {testStatus !== 'idle' && (
            <span
              className={`text-sm ${
                testStatus === 'success'
                  ? 'text-tech-olive'
                  : testStatus === 'error'
                  ? 'text-red-400'
                  : 'text-warm-ivory/60'
              }`}
            >
              {testStatus === 'success' && '✓ '}
              {testStatus === 'error' && '✗ '}
              {testMessage}
            </span>
          )}
        </div>

        {/* Save Settings */}
        {hasChanges && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 text-sm bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </section>

      {/* API Keys Section */}
      <section className="space-y-4 pt-4 border-t border-warm-ivory/10">
        <h3 className="text-sm font-medium text-warm-ivory/80">API Keys</h3>
        <p className="text-xs text-warm-ivory/40">
          API keys are stored securely and never exposed to the client.
        </p>

        {/* OpenAI Key */}
        <div className="space-y-2">
          <label className="block text-xs text-warm-ivory/50">OpenAI API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={apiKeys.openai ? '••••••••••••••••' : 'sk-...'}
              className="flex-1 px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 text-warm-ivory rounded placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive/50"
            />
            <button
              onClick={handleSaveOpenaiKey}
              disabled={saving || !openaiKey.trim()}
              className="px-4 py-2 text-sm bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            {apiKeys.openai && (
              <button
                onClick={() => onDeleteApiKey('openai')}
                disabled={saving}
                className="px-4 py-2 text-sm text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          {apiKeys.openai && (
            <p className="text-xs text-tech-olive">✓ Key saved</p>
          )}
        </div>

        {/* Anthropic Key */}
        <div className="space-y-2">
          <label className="block text-xs text-warm-ivory/50">Anthropic API Key</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder={apiKeys.anthropic ? '••••••••••••••••' : 'sk-ant-...'}
              className="flex-1 px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 text-warm-ivory rounded placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive/50"
            />
            <button
              onClick={handleSaveAnthropicKey}
              disabled={saving || !anthropicKey.trim()}
              className="px-4 py-2 text-sm bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            {apiKeys.anthropic && (
              <button
                onClick={() => onDeleteApiKey('anthropic')}
                disabled={saving}
                className="px-4 py-2 text-sm text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          {apiKeys.anthropic && (
            <p className="text-xs text-tech-olive">✓ Key saved</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default AISettingsForm;
