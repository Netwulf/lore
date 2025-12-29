'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSuggestions, type SuggestedPage } from '@/lib/hooks/useSuggestions';

interface RelatedSuggestionsPanelProps {
  pageId: string;
  pageTitle: string;
  onAddLink?: (targetPageId: string, targetPageTitle: string) => void;
}

export function RelatedSuggestionsPanel({
  pageId,
  pageTitle,
  onAddLink,
}: RelatedSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<SuggestedPage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const supabase = createClient();
  const { getSuggestions, dismissSuggestion, loading } = useSuggestions();

  // Get user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Fetch suggestions when page changes
  const fetchSuggestions = useCallback(async () => {
    if (!userId || !pageId || !pageTitle) return;
    const results = await getSuggestions(pageId, pageTitle, userId);
    setSuggestions(results);
  }, [userId, pageId, pageTitle, getSuggestions]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Handle add link click
  const handleAddLink = async (suggestion: SuggestedPage) => {
    setAddingId(suggestion.id);
    try {
      if (onAddLink) {
        onAddLink(suggestion.id, suggestion.title);
      } else {
        // Fallback: create link in database directly
        if (userId) {
          await supabase.from('page_links').insert({
            source_id: pageId,
            target_id: suggestion.id,
            user_id: userId,
          });
        }
      }
      // Remove from suggestions list
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error adding link:', err);
    } finally {
      setAddingId(null);
    }
  };

  // Handle dismiss click
  const handleDismiss = async (suggestion: SuggestedPage) => {
    if (!userId) return;
    await dismissSuggestion(pageId, suggestion.id, userId);
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  // Don't render if no suggestions and not loading
  if (!loading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-warm-ivory/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 text-left group"
      >
        <svg
          className={`w-4 h-4 text-warm-ivory/40 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {/* Lightbulb icon */}
        <svg
          className="w-4 h-4 text-tech-olive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span className="text-sm text-warm-ivory/60 group-hover:text-warm-ivory transition-colors">
          Related
        </span>
        <span className="text-xs text-warm-ivory/40 bg-warm-ivory/5 px-2 py-0.5 rounded">
          {loading ? '...' : suggestions.length}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="text-sm text-warm-ivory/40 py-2">
              Finding related pages...
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-3 rounded bg-warm-ivory/5 hover:bg-warm-ivory/10 transition-colors group"
              >
                {/* Page info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg
                    className="w-4 h-4 text-warm-ivory/40 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm text-warm-ivory truncate">
                    {suggestion.title}
                  </span>
                  {/* Source badge */}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                      suggestion.source === 'co-linked'
                        ? 'bg-twilight-violet/50 text-warm-ivory/60'
                        : 'bg-tech-olive/20 text-tech-olive'
                    }`}
                  >
                    {suggestion.source === 'co-linked' ? 'linked' : 'similar'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Add link button */}
                  <button
                    onClick={() => handleAddLink(suggestion)}
                    disabled={addingId === suggestion.id}
                    className="p-1.5 rounded hover:bg-tech-olive/20 text-tech-olive transition-colors disabled:opacity-50"
                    title="Add link to this page"
                  >
                    {addingId === suggestion.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    )}
                  </button>
                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(suggestion)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-warm-ivory/40 hover:text-red-400 transition-colors"
                    title="Dismiss suggestion"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default RelatedSuggestionsPanel;
