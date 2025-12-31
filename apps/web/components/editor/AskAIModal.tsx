/**
 * Ask AI Modal
 * Story: LORE-5.1 - Expand AI Slash Commands
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface AskAIModalProps {
  context?: string;
  pageTitle?: string;
  onInsert: (answer: string) => void;
  onClose: () => void;
}

export function AskAIModal({ context, pageTitle, onInsert, onClose }: AskAIModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnswer('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          currentPageId: undefined, // Will use context instead
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let fullAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content') {
                fullAnswer += parsed.text;
                setAnswer(fullAnswer);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
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
            <span className="text-xl">💬</span>
            <h2 className="text-lg font-medium text-warm-ivory">Ask AI</h2>
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
          {/* Question Input */}
          <div>
            <label className="block text-sm text-warm-ivory/60 mb-2">Your Question</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 bg-void-black border border-warm-ivory/20 rounded text-warm-ivory placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleAsk();
                  }
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleAsk}
                disabled={isLoading || !question.trim()}
                className="px-4 py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '...' : 'Ask'}
              </button>
            </div>
          </div>

          {/* Context indicator */}
          {pageTitle && (
            <div className="text-xs text-warm-ivory/40">
              Context: {pageTitle}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Answer */}
          {answer && (
            <div>
              <label className="block text-sm text-warm-ivory/60 mb-2">Answer</label>
              <div className="p-4 bg-tech-olive/5 border border-tech-olive/20 rounded text-warm-ivory text-sm max-h-64 overflow-auto whitespace-pre-wrap">
                {answer}
                {isLoading && <span className="animate-pulse">▊</span>}
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
            Close
          </button>
          {answer && !isLoading && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(answer);
                }}
                className="px-4 py-2 border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  onInsert(answer);
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

export default AskAIModal;
