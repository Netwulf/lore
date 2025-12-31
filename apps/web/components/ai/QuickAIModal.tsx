/**
 * Quick AI Modal (⌘J)
 * Story: LORE-5.3 - Quick AI Anywhere
 *
 * Centered modal for quick AI prompts with keyboard shortcut
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface QuickAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  context?: {
    pageTitle?: string;
    pageContent?: string;
    selection?: string;
  };
}

export function QuickAIModal({
  isOpen,
  onClose,
  onInsert,
  onReplace,
  context,
}: QuickAIModalProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setResponse('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // Build message with context
      let fullMessage = prompt;
      if (context?.selection) {
        fullMessage = `Selected text: "${context.selection}"\n\nQuestion: ${prompt}`;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          currentPageId: undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      let fullResponse = '';

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
                fullResponse += parsed.text;
                setResponse(fullResponse);
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
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, context, isLoading]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(response);
  }, [response]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-[#0a0a0a] border border-warm-ivory/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Input Section */}
        <div className="p-4 border-b border-warm-ivory/10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-tech-olive/20 text-tech-olive">
              ✨
            </div>
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask AI anything..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-warm-ivory placeholder:text-warm-ivory/30 text-lg focus:outline-none"
            />
            <div className="flex-shrink-0 text-warm-ivory/30 text-sm">
              ⌘J
            </div>
          </div>

          {/* Context indicator */}
          {context?.pageTitle && (
            <div className="mt-2 ml-11 text-xs text-warm-ivory/40">
              Context: {context.pageTitle}
              {context.selection && ` (${context.selection.length} chars selected)`}
            </div>
          )}
        </div>

        {/* Response Section */}
        {(response || isLoading || error) && (
          <div className="p-4 max-h-[50vh] overflow-auto">
            {error ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            ) : (
              <div className="text-warm-ivory/90 text-sm whitespace-pre-wrap">
                {response}
                {isLoading && <span className="animate-pulse text-tech-olive">▊</span>}
              </div>
            )}
          </div>
        )}

        {/* Actions Section */}
        <div className="p-4 border-t border-warm-ivory/10 flex items-center justify-between">
          <div className="text-xs text-warm-ivory/40">
            <span className="px-1.5 py-0.5 bg-warm-ivory/10 rounded">Enter</span> to send
            <span className="mx-2">·</span>
            <span className="px-1.5 py-0.5 bg-warm-ivory/10 rounded">Esc</span> to close
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Close
            </button>

            {response && !isLoading && (
              <>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
                >
                  Copy
                </button>

                {context?.selection && (
                  <button
                    onClick={() => {
                      onReplace(response);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-sm border border-warm-ivory/20 rounded text-warm-ivory/80 hover:bg-warm-ivory/5 transition-colors"
                  >
                    Replace Selection
                  </button>
                )}

                <button
                  onClick={() => {
                    onInsert(response);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-sm bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors"
                >
                  Insert at Cursor
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickAIModal;
