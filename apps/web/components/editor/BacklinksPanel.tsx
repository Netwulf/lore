'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PartialBlock } from '@blocknote/core';

interface Backlink {
  pageId: string;
  pageTitle: string;
  context: string;
}

interface BacklinksPanelProps {
  pageId: string;
  pageTitle: string;
}

/**
 * Extract context around a wiki link in BlockNote content
 */
function extractContext(
  content: PartialBlock[],
  targetPageId: string,
  targetPageTitle: string
): string {
  let context = '';

  const traverse = (node: any): boolean => {
    // Check if this is a wikiLink to the target page
    if (node.type === 'wikiLink' && node.props?.pageId === targetPageId) {
      // Found the link, but we need to get surrounding text
      return true;
    }

    // For text nodes, accumulate
    if (node.type === 'text' && node.text) {
      context += node.text + ' ';
    }

    // Traverse content array
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        if (traverse(child)) {
          // Found the link in this branch
          return true;
        }
      }
    }

    // Traverse children array
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (traverse(child)) {
          return true;
        }
      }
    }

    return false;
  };

  // Traverse all blocks
  for (const block of content) {
    context = '';
    if (traverse(block)) {
      // Found the link in this block, return the context
      const trimmed = context.trim();
      if (trimmed.length > 100) {
        return `...${trimmed.slice(0, 100)}...`;
      }
      return trimmed || `Contains link to [[${targetPageTitle}]]`;
    }
  }

  return `Links to [[${targetPageTitle}]]`;
}

export function BacklinksPanel({ pageId, pageTitle }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch backlinks
  const fetchBacklinks = useCallback(async () => {
    setLoading(true);
    try {
      // Query page_links with source page details
      const { data, error } = await supabase
        .from('page_links')
        .select(
          `
          source_id,
          pages!page_links_source_id_fkey (
            id,
            title,
            content
          )
        `
        )
        .eq('target_id', pageId);

      if (error) {
        console.error('Error fetching backlinks:', error);
        setBacklinks([]);
        return;
      }

      // Transform data with context extraction
      const links: Backlink[] =
        data?.map((link: any) => ({
          pageId: link.pages.id,
          pageTitle: link.pages.title,
          context: extractContext(
            link.pages.content || [],
            pageId,
            pageTitle
          ),
        })) || [];

      setBacklinks(links);
    } catch (err) {
      console.error('Error fetching backlinks:', err);
      setBacklinks([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, pageId, pageTitle]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  const handleNavigate = (targetPageId: string) => {
    router.push(`/page/${targetPageId}`);
  };

  return (
    <div className="mt-16 pt-8 border-t border-warm-ivory/10">
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
        <span className="text-sm text-warm-ivory/60 group-hover:text-warm-ivory transition-colors">
          Backlinks
        </span>
        <span className="text-xs text-warm-ivory/40 bg-warm-ivory/5 px-2 py-0.5 rounded">
          {loading ? '...' : backlinks.length}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-warm-ivory/40">Loading backlinks...</div>
          ) : backlinks.length === 0 ? (
            <div className="text-sm text-warm-ivory/40 py-4">
              <p>No pages link to this one yet.</p>
              <p className="mt-1 text-xs">
                Create connections using{' '}
                <span className="text-tech-olive">[[page name]]</span> syntax.
              </p>
            </div>
          ) : (
            backlinks.map((link) => (
              <button
                key={link.pageId}
                onClick={() => handleNavigate(link.pageId)}
                className="w-full text-left p-3 rounded bg-warm-ivory/5 hover:bg-warm-ivory/10 transition-colors group"
              >
                {/* Page title */}
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-warm-ivory/40"
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
                  <span className="text-sm font-medium text-warm-ivory group-hover:text-tech-olive transition-colors">
                    {link.pageTitle}
                  </span>
                </div>
                {/* Context preview */}
                <p className="mt-1 text-xs text-warm-ivory/50 line-clamp-2">
                  {link.context}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default BacklinksPanel;
