'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Page } from '@lore/db';

export interface SearchResult {
  id: string;
  title: string;
  preview: string;
  similarity: number | null;
  isSemanticResult: boolean;
}

interface UseSearchOptions {
  pages: Page[];
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  isSemanticMode: boolean;
  isPendingSemantic: boolean;
  flushSearch: () => void;
  clearSearch: () => void;
}

/**
 * Search hook with semantic search support
 * Story: E4-S2 - Extract search hook
 *
 * Features:
 * - Instant local filtering
 * - Debounced semantic search (1s by default)
 * - AbortController for request cancellation
 * - Unified API for search functionality
 */
export function useSearch({
  pages,
  debounceMs = 1000,
  minQueryLength = 2,
}: UseSearchOptions): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSemanticMode, setIsSemanticMode] = useState(false);
  const [isPendingSemantic, setIsPendingSemantic] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Local filter for instant results
  const localFilteredResults: SearchResult[] = query.trim()
    ? pages
        .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
        .map((p) => ({
          id: p.id,
          title: p.title,
          preview: '',
          similarity: null,
          isSemanticResult: false,
        }))
    : pages.map((p) => ({
        id: p.id,
        title: p.title,
        preview: '',
        similarity: null,
        isSemanticResult: false,
      }));

  // Combined results: semantic if available, otherwise local
  const results =
    searchResults.length > 0 || (query.length >= minQueryLength && isSearching)
      ? searchResults
      : localFilteredResults;

  // Perform semantic search
  const performSemanticSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setSearchResults([]);
      setIsSemanticMode(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setIsSemanticMode(data.isSemanticSearch || false);
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [minQueryLength]);

  // Handle query changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length >= minQueryLength) {
      setIsPendingSemantic(true);
      searchTimeoutRef.current = setTimeout(() => {
        setIsPendingSemantic(false);
        performSemanticSearch(query);
      }, debounceMs);
    } else {
      setSearchResults([]);
      setIsSemanticMode(false);
      setIsPendingSemantic(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, performSemanticSearch]);

  // Force immediate semantic search
  const flushSearch = useCallback(() => {
    if (query.length >= minQueryLength) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setIsPendingSemantic(false);
      performSemanticSearch(query);
    }
  }, [query, minQueryLength, performSemanticSearch]);

  // Clear search state
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setIsSemanticMode(false);
    setIsPendingSemantic(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isSemanticMode,
    isPendingSemantic,
    flushSearch,
    clearSearch,
  };
}

export default useSearch;
