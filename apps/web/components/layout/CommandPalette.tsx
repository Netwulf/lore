/**
 * Command Palette - Quick navigation via ⌘K
 * Story: E5-S4 - Otimizar Semantic Search Debounce
 *
 * Changes:
 * - Reduced debounce from 1000ms to 300ms
 * - Improved AbortController cleanup
 */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Page } from '@lore/db';

// E5-S4: Reduced from 1000ms to 300ms for faster feedback
const SEMANTIC_DEBOUNCE_MS = 300;

interface CommandPaletteProps {
  pages: Page[];
}

interface SearchResult {
  id: string;
  title: string;
  preview: string;
  similarity: number | null;
  isSemanticResult: boolean;
}

/**
 * Command Palette - Quick navigation via ⌘K (Mac) / Ctrl+K (Windows/Linux)
 *
 * Features:
 * - Global keyboard shortcut to open
 * - Semantic search (via embeddings) with text fallback
 * - Real-time page title search
 * - Keyboard navigation (↑/↓/Enter/Esc)
 * - Click outside to close
 */
export default function CommandPalette({ pages }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSemanticMode, setIsSemanticMode] = useState(false);
  const [isPendingSemantic, setIsPendingSemantic] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Local filter for instant results while semantic search is loading
  const localFilteredPages = query.trim()
    ? pages.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      )
    : pages;

  // Use semantic results if available, otherwise local filtered
  const displayResults =
    searchResults.length > 0 || (query.length >= 2 && isSearching)
      ? searchResults
      : localFilteredPages.map((p) => ({
          id: p.id,
          title: p.title,
          preview: '',
          similarity: null,
          isSemanticResult: false,
        }));

  // Get parent path for hierarchy hint
  const getParentPath = useCallback(
    (pageId: string): string => {
      const page = pages.find((p) => p.id === pageId);
      if (!page || !page.parent_id) return '';
      const parent = pages.find((p) => p.id === page.parent_id);
      if (!parent) return '';
      const grandParentPath = getParentPath(parent.id);
      return grandParentPath ? `${grandParentPath} / ${parent.title}` : parent.title;
    },
    [pages]
  );

  // Debounced semantic search with abort support
  const performSemanticSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSemanticMode(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
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
      // Ignore abort errors (expected when user continues typing)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Search error:', error);
      // Keep local results on error
    } finally {
      setIsSearching(false);
    }
  }, []);

  // E5-S4: Handle query change with reduced debounce (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel pending request when query changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (query.length >= 2) {
      // Mark pending semantic search
      setIsPendingSemantic(true);
      // Local results are instant, semantic search is delayed
      searchTimeoutRef.current = setTimeout(() => {
        setIsPendingSemantic(false);
        performSemanticSearch(query);
      }, SEMANTIC_DEBOUNCE_MS);
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
  }, [query, performSemanticSearch]);

  // E5-S4: Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Force immediate semantic search
  const flushSemanticSearch = useCallback(() => {
    if (query.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setIsPendingSemantic(false);
      performSemanticSearch(query);
    }
  }, [query, performSemanticSearch]);

  // Global keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
      setSearchResults([]);
      setIsSemanticMode(false);
    }
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [displayResults.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && displayResults.length > 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, displayResults.length]);

  // Handle keyboard navigation within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, displayResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (displayResults[selectedIndex]) {
          navigateToPage(displayResults[selectedIndex].id);
        } else if (query.length >= 2 && !isSearching) {
          // No result selected - force immediate semantic search
          flushSemanticSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeModal();
        break;
    }
  };

  // Navigate to selected page
  const navigateToPage = (pageId: string) => {
    router.push(`/page/${pageId}`);
    closeModal();
  };

  // Close and reset modal
  const closeModal = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setSearchResults([]);
    setIsSemanticMode(false);
    setIsPendingSemantic(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-void-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-twilight-deep border border-warm-ivory/10 rounded-lg shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-ivory/10">
          {isSearching ? (
            <svg
              className="w-5 h-5 text-tech-olive animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-warm-ivory/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-warm-ivory placeholder:text-warm-ivory/40 outline-none text-base"
            aria-label="Search pages"
            autoComplete="off"
          />
          {isSemanticMode && (
            <span className="px-2 py-0.5 text-xs text-tech-olive bg-tech-olive/10 rounded">
              AI
            </span>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-warm-ivory/40 bg-warm-ivory/5 rounded">
            esc
          </kbd>
        </div>

        {/* Results list */}
        {displayResults.length > 0 ? (
          <ul
            ref={listRef}
            className="max-h-[350px] overflow-y-auto py-2"
            role="listbox"
            aria-label="Search results"
          >
            {displayResults.map((result, index) => {
              const parentPath = getParentPath(result.id);
              const isSelected = index === selectedIndex;

              return (
                <li
                  key={result.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => navigateToPage(result.id)}
                  className={`
                    flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors
                    ${
                      isSelected
                        ? 'bg-tech-olive/20 text-warm-ivory'
                        : 'text-warm-ivory/70 hover:bg-warm-ivory/5'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                      isSelected ? 'bg-tech-olive' : 'bg-transparent'
                    }`}
                  />

                  {/* Page icon */}
                  <svg
                    className="w-4 h-4 text-warm-ivory/40 flex-shrink-0 mt-0.5"
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

                  {/* Page info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {parentPath && (
                        <span className="text-xs text-warm-ivory/40 truncate">
                          {parentPath} /
                        </span>
                      )}
                      <span className="text-sm font-medium truncate">
                        {result.title}
                      </span>
                      {result.similarity !== null && (
                        <span className="text-xs text-tech-olive/80 flex-shrink-0">
                          {result.similarity}%
                        </span>
                      )}
                    </div>
                    {result.preview && (
                      <p className="text-xs text-warm-ivory/40 truncate mt-0.5">
                        {result.preview}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
            {/* Semantic search indicator */}
            {(isPendingSemantic || isSearching) && query.length >= 2 && (
              <li className="flex items-center gap-3 px-4 py-2.5 text-warm-ivory/50">
                <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                <svg
                  className="w-4 h-4 text-tech-olive animate-spin flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm">
                  {isPendingSemantic ? 'Searching with AI...' : 'Searching semantically...'}
                </span>
              </li>
            )}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-warm-ivory/40">
            {isSearching
              ? 'Searching...'
              : query
              ? 'No pages found'
              : 'No pages yet'}
          </div>
        )}

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-warm-ivory/10 text-xs text-warm-ivory/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-warm-ivory/5 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-warm-ivory/5 rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-warm-ivory/5 rounded">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-warm-ivory/5 rounded">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
