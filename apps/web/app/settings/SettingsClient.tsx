'use client';

import Link from 'next/link';
import { useSettings } from '@/lib/hooks/useSettings';
import { AISettingsForm } from '@/components/settings/AISettingsForm';
import LogoutButton from '@/components/LogoutButton';

interface SettingsClientProps {
  userEmail?: string;
}

export default function SettingsClient({ userEmail }: SettingsClientProps) {
  const {
    settings,
    apiKeys,
    loading,
    saving,
    saveSettings,
    saveApiKey,
    deleteApiKey,
  } = useSettings();

  return (
    <div className="min-h-screen bg-void-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-warm-ivory/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-warm-ivory/60 hover:text-warm-ivory transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-lg font-display font-semibold text-warm-ivory">
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-warm-ivory/60 text-sm">{userEmail}</span>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* AI Settings Section */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <svg
              className="w-5 h-5 text-tech-olive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-display font-semibold text-warm-ivory">
              AI Configuration
            </h2>
          </div>

          <div className="bg-warm-ivory/5 border border-warm-ivory/10 rounded-lg p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-warm-ivory/40">Loading settings...</div>
              </div>
            ) : (
              <AISettingsForm
                settings={settings}
                apiKeys={apiKeys}
                saving={saving}
                onSaveSettings={saveSettings}
                onSaveApiKey={saveApiKey}
                onDeleteApiKey={deleteApiKey}
              />
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="text-sm text-warm-ivory/40 space-y-2">
          <p>
            <strong className="text-warm-ivory/60">Note:</strong> API keys are
            stored securely in your personal settings and are never shared or
            exposed to the browser.
          </p>
          <p>
            For Ollama, make sure the service is running locally at the
            specified URL.
          </p>
        </section>
      </main>
    </div>
  );
}
