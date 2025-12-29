'use client';

/**
 * Tag Suggestions Popup
 * Story: LORE-3.7 - AI Auto-Tagging
 *
 * Shows AI-suggested tags after page save with accept/reject options
 */

import { useState, useEffect } from 'react';
import { useTags, type TagSuggestion } from '@/lib/hooks/useTags';

interface TagSuggestionsPopupProps {
  pageId: string;
  content: unknown;
  onClose: () => void;
  onTagsApplied?: () => void;
}

export function TagSuggestionsPopup({
  pageId,
  content,
  onClose,
  onTagsApplied,
}: TagSuggestionsPopupProps) {
  const [suggestions, setSuggestions] = useState<(TagSuggestion & { selected: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { suggestTags, applyTagSuggestions } = useTags();

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await suggestTags(pageId, content);
        setSuggestions(results.map(s => ({ ...s, selected: true })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [pageId, content, suggestTags]);

  const toggleTag = (index: number) => {
    setSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyTagSuggestions(pageId, suggestions);
      onTagsApplied?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply tags');
    } finally {
      setApplying(false);
    }
  };

  const selectedCount = suggestions.filter(s => s.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80">
      <div className="bg-violet-deep border border-warm-ivory/10 rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-warm-ivory/10 flex items-center gap-3">
          <TagIcon className="w-5 h-5 text-tech-olive" />
          <h3 className="text-lg font-medium text-warm-ivory">Suggested Tags</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-tech-olive/30 border-t-tech-olive rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="text-sm text-warm-ivory/60 hover:text-warm-ivory"
              >
                Dismiss
              </button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-warm-ivory/60 mb-4">
                No tag suggestions available for this content.
              </p>
              <button
                onClick={onClose}
                className="text-sm text-warm-ivory/60 hover:text-warm-ivory"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-warm-ivory/60 mb-4">
                Select the tags you want to add to this page:
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-warm-ivory/5 hover:bg-warm-ivory/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={suggestion.selected}
                      onChange={() => toggleTag(index)}
                      className="w-4 h-4 rounded border-warm-ivory/20 bg-transparent text-tech-olive focus:ring-tech-olive/50"
                    />
                    <span className="text-warm-ivory flex-1">{suggestion.name}</span>
                    {suggestion.isExisting && (
                      <span className="text-xs text-warm-ivory/40 px-2 py-0.5 rounded bg-warm-ivory/10">
                        existing
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="px-6 py-4 border-t border-warm-ivory/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleApply}
              disabled={applying || selectedCount === 0}
              className="px-4 py-2 text-sm bg-tech-olive text-void-black rounded hover:bg-tech-olive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {applying ? (
                <>
                  <div className="w-4 h-4 border-2 border-void-black/30 border-t-void-black rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  Apply {selectedCount} Tag{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
    />
  </svg>
);

export default TagSuggestionsPopup;
