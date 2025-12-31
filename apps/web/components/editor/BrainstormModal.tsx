/**
 * Brainstorm Modal
 * Story: LORE-5.1 - Expand AI Slash Commands
 */

'use client';

import { useState, useEffect } from 'react';

interface BrainstormModalProps {
  context?: string;
  pageTitle?: string;
  onInsert: (ideas: string) => void;
  onClose: () => void;
}

export function BrainstormModal({ context, pageTitle, onInsert, onClose }: BrainstormModalProps) {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrainstorm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || undefined,
          context: context || undefined,
          pageTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Brainstorming failed');
      }

      setIdeas(data.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brainstorming failed');
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
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-lg font-medium text-warm-ivory">Brainstorm Ideas</h2>
          </div>
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
          {/* Topic Input */}
          <div>
            <label className="block text-sm text-warm-ivory/60 mb-2">
              Topic {context && '(or use page context below)'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to brainstorm about?"
              className="w-full px-3 py-2 bg-void-black border border-warm-ivory/20 rounded text-warm-ivory placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleBrainstorm();
                }
              }}
            />
          </div>

          {/* Context Preview */}
          {context && !topic && (
            <div>
              <label className="block text-sm text-warm-ivory/60 mb-2">
                Using context from: {pageTitle || 'Current page'}
              </label>
              <div className="p-3 bg-void-black/50 rounded text-warm-ivory/60 text-sm max-h-24 overflow-auto">
                {context.slice(0, 200)}...
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!ideas && (
            <button
              onClick={handleBrainstorm}
              disabled={isLoading || (!topic && !context)}
              className="w-full py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating ideas...
                </span>
              ) : (
                'Generate Ideas'
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Ideas Result */}
          {ideas && (
            <div>
              <label className="block text-sm text-warm-ivory/60 mb-2">Generated Ideas</label>
              <div className="p-4 bg-tech-olive/5 border border-tech-olive/20 rounded text-warm-ivory text-sm max-h-64 overflow-auto whitespace-pre-wrap">
                {ideas}
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
          {ideas && (
            <>
              <button
                onClick={() => {
                  setIdeas('');
                  setTopic('');
                }}
                className="px-4 py-2 border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ideas);
                }}
                className="px-4 py-2 border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  onInsert(ideas);
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

export default BrainstormModal;
