'use client';

/**
 * AI Inline Actions Toolbar
 * Story: LORE-3.6 - AI Inline Actions
 *
 * Floating toolbar that appears when text is selected, providing
 * AI-powered text transformation actions.
 */

import { useState } from 'react';

type InlineAction = 'expand' | 'summarize' | 'rewrite';

interface InlineAIToolbarProps {
  selectedText: string;
  onApply: (newText: string) => void;
  onCancel: () => void;
  position: { top: number; left: number };
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton = ({ icon, label, onClick, disabled }: ActionButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 px-3 py-2 text-sm text-warm-ivory/80 hover:text-warm-ivory hover:bg-warm-ivory/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export function InlineAIToolbar({
  selectedText,
  onApply,
  onCancel,
  position,
}: InlineAIToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<InlineAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: InlineAction) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setCurrentAction(action);

    try {
      const response = await fetch('/api/ai/inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: selectedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process text');
      }

      setPreview(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (preview) {
      onApply(preview);
      setPreview(null);
      setCurrentAction(null);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setCurrentAction(null);
    setError(null);
  };

  // Preview mode
  if (preview !== null) {
    return (
      <div
        className="fixed z-50 bg-violet-deep border border-warm-ivory/10 rounded-lg shadow-xl max-w-lg animate-in fade-in slide-in-from-top-2"
        style={{ top: position.top, left: position.left }}
      >
        <div className="px-4 py-3 border-b border-warm-ivory/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-warm-ivory capitalize">
              Preview: {currentAction}
            </span>
            <span className="text-xs text-warm-ivory/40">
              {preview.length} chars
            </span>
          </div>
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          <p className="text-sm text-warm-ivory/80 whitespace-pre-wrap">
            {preview}
          </p>
        </div>

        <div className="px-4 py-3 border-t border-warm-ivory/10 flex items-center justify-between gap-2">
          <button
            onClick={() => handleAction(currentAction!)}
            disabled={loading}
            className="text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors disabled:opacity-50"
          >
            Regenerate
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancelPreview}
              className="px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 text-sm bg-tech-olive text-void-black rounded hover:bg-tech-olive/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Action menu
  return (
    <div
      className="fixed z-50 bg-violet-deep border border-warm-ivory/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2"
      style={{ top: position.top, left: position.left }}
    >
      {loading ? (
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-tech-olive/30 border-t-tech-olive rounded-full animate-spin" />
          <span className="text-sm text-warm-ivory/60">
            {currentAction === 'expand' && 'Expanding...'}
            {currentAction === 'summarize' && 'Summarizing...'}
            {currentAction === 'rewrite' && 'Rewriting...'}
          </span>
        </div>
      ) : error ? (
        <div className="p-4 max-w-xs">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setError(null)}
              className="px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Try again
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <ActionButton
            icon={<ExpandIcon />}
            label="Expand"
            onClick={() => handleAction('expand')}
          />
          <ActionButton
            icon={<SummarizeIcon />}
            label="Summarize"
            onClick={() => handleAction('summarize')}
          />
          <ActionButton
            icon={<RewriteIcon />}
            label="Rewrite"
            onClick={() => handleAction('rewrite')}
          />
          <div className="border-t border-warm-ivory/10">
            <ActionButton
              icon={<CloseIcon />}
              label="Cancel"
              onClick={onCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
const ExpandIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
    />
  </svg>
);

const SummarizeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 6h16M4 12h8m-8 6h16"
    />
  </svg>
);

const RewriteIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
    />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default InlineAIToolbar;
