'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SuggestedPage {
  id: string;
  title: string;
  source: 'title' | 'co-linked';
  score?: number;
}

const DISMISSED_KEY = 'lore_dismissed_suggestions';

/**
 * Get dismissed suggestions from localStorage
 */
function getDismissedFromStorage(pageId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return [];
    const all = JSON.parse(stored);
    return all[pageId] || [];
  } catch {
    return [];
  }
}

/**
 * Save dismissed suggestion to localStorage
 */
function saveDismissedToStorage(pageId: string, suggestedId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[pageId] = all[pageId] || [];
    if (!all[pageId].includes(suggestedId)) {
      all[pageId].push(suggestedId);
    }
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Error saving dismissed suggestion:', err);
  }
}

/**
 * Simple fuzzy match using word overlap
 */
function fuzzyTitleMatch(
  title: string,
  otherTitle: string
): number {
  const words1 = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = otherTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

export function useSuggestions() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  /**
   * Get suggestions for a page based on title similarity and co-linked pages
   */
  const getSuggestions = useCallback(
    async (
      pageId: string,
      pageTitle: string,
      userId: string
    ): Promise<SuggestedPage[]> => {
      setLoading(true);
      try {
        const suggestions: SuggestedPage[] = [];
        const dismissed = getDismissedFromStorage(pageId);

        // 1. Try to get co-linked pages via RPC function (if available)
        try {
          const { data: coLinked, error: coLinkedError } = await supabase.rpc(
            'get_co_linked_pages' as any,
            { p_page_id: pageId, p_user_id: userId } as any
          );

          if (!coLinkedError && coLinked && Array.isArray(coLinked)) {
            for (const page of coLinked as any[]) {
              if (!dismissed.includes(page.id)) {
                suggestions.push({
                  id: page.id,
                  title: page.title,
                  source: 'co-linked',
                  score: page.score,
                });
              }
            }
          }
        } catch {
          // RPC function may not exist yet, continue with fallback
        }

        // 2. Get similar titles (client-side fuzzy matching as fallback)
        // Try the database function first
        let usedDbSimilarity = false;
        try {
          const { data: similarFromDb, error: similarError } = await supabase.rpc(
            'get_similar_title_pages' as any,
            { p_page_id: pageId, p_page_title: pageTitle, p_user_id: userId } as any
          );

          if (!similarError && similarFromDb && Array.isArray(similarFromDb)) {
            usedDbSimilarity = true;
            for (const page of similarFromDb as any[]) {
              if (!dismissed.includes(page.id) && !suggestions.some(s => s.id === page.id)) {
                suggestions.push({
                  id: page.id,
                  title: page.title,
                  source: 'title',
                  score: page.similarity,
                });
              }
            }
          }
        } catch {
          // RPC function may not exist yet
        }

        if (!usedDbSimilarity) {
          // Fallback: client-side fuzzy matching
          const { data: allPages } = await supabase
            .from('pages')
            .select('id, title')
            .eq('user_id', userId)
            .neq('id', pageId)
            .limit(50);

          // Get existing links to filter out
          const { data: existingLinks } = await supabase
            .from('page_links')
            .select('target_id')
            .eq('source_id', pageId);

          const linkedIds = existingLinks?.map((l) => l.target_id) || [];

          if (allPages) {
            const scored = allPages
              .filter((p) => !linkedIds.includes(p.id) && !dismissed.includes(p.id))
              .map((p) => ({
                id: p.id,
                title: p.title,
                score: fuzzyTitleMatch(pageTitle, p.title),
              }))
              .filter((p) => p.score > 0.2)
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);

            for (const page of scored) {
              if (!suggestions.some((s) => s.id === page.id)) {
                suggestions.push({
                  id: page.id,
                  title: page.title,
                  source: 'title',
                  score: page.score,
                });
              }
            }
          }
        }

        // Limit to 5 suggestions total
        return suggestions.slice(0, 5);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Dismiss a suggestion (save to localStorage and optionally to DB)
   */
  const dismissSuggestion = useCallback(
    async (pageId: string, suggestedId: string, userId: string): Promise<void> => {
      // Save locally
      saveDismissedToStorage(pageId, suggestedId);

      // Also save to database for persistence across devices
      try {
        await supabase.from('dismissed_suggestions').insert({
          page_id: pageId,
          suggested_page_id: suggestedId,
          user_id: userId,
        });
      } catch (err) {
        // Ignore errors - local storage is the primary persistence
        console.error('Error saving dismissed to DB:', err);
      }
    },
    [supabase]
  );

  return {
    getSuggestions,
    dismissSuggestion,
    loading,
  };
}

export default useSuggestions;
