/**
 * Translate Modal
 * Story: LORE-5.1 - Expand AI Slash Commands
 */

'use client';

import { useState, useEffect } from 'react';

interface TranslateModalProps {
  text: string;
  onInsert: (translatedText: string) => void;
  onClose: () => void;
}

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi',
  'Dutch', 'Swedish', 'Polish', 'Turkish', 'Vietnamese', 'Thai',
];

export function TranslateModal({ text, onInsert, onClose }: TranslateModalProps) {
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslation(data.translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-[#1a1025] border border-warm-ivory/10 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-ivory/10">
          <h2 className="text-lg font-medium text-warm-ivory">Translate Text</h2>
          <button
            onClick={onClose}
            className="text-warm-ivory/40 hover:text-warm-ivory transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Original Text */}
          <div>
            <label className="block text-sm text-warm-ivory/60 mb-2">Original Text</label>
            <div className="p-3 bg-void-black/50 rounded text-warm-ivory/80 text-sm max-h-32 overflow-auto">
              {text}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-sm text-warm-ivory/60 mb-2">Translate to</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-void-black border border-warm-ivory/20 rounded text-warm-ivory focus:outline-none focus:border-tech-olive"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Translate Button */}
          {!translation && (
            <button
              onClick={handleTranslate}
              disabled={isLoading}
              className="w-full py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Translation Result */}
          {translation && (
            <div>
              <label className="block text-sm text-warm-ivory/60 mb-2">Translation ({targetLanguage})</label>
              <div className="p-3 bg-tech-olive/10 border border-tech-olive/20 rounded text-warm-ivory text-sm max-h-48 overflow-auto">
                {translation}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-warm-ivory/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-warm-ivory/60 hover:text-warm-ivory transition-colors"
          >
            Cancel
          </button>
          {translation && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(translation);
                }}
                className="px-4 py-2 border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  onInsert(translation);
                  onClose();
                }}
                className="px-4 py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors"
              >
                Insert
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TranslateModal;
