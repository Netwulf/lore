/**
 * Backlinks Panel
 * Story: E5-S2 - Fix BacklinksPanel N+1 Query
 *
 * Uses server-side RPC to avoid fetching full content for each backlink
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Backlink {
  pageId: string;
  pageTitle: string;
  context: string;
}

interface BacklinksPanelProps {
  pageId: string;
  pageTitle: string;
}

// RPC response type
interface BacklinkRPCResult {
  source_id: string;
  source_title: string;
  context_preview: string | null;
}

export function BacklinksPanel({ pageId, pageTitle }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  // E5-S2: Memoize supabase client
  const supabase = useMemo(() => createClient(), []);

  // E5-S2: Use RPC for optimized query
  const fetchBacklinks = useCallback(async () => {
    setLoading(true);
    try {
      // Try RPC first (after migration is applied)
      const { data, error } = await supabase
        // @ts-expect-error - RPC function exists in DB but not in generated types yet
        .rpc('get_backlinks_with_context', { p_page_id: pageId }) as { data: BacklinkRPCResult[] | null; error: any };

      if (error) {
        // Fallback to direct query if RPC not available
        console.warn('RPC not available, using fallback:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('page_links')
          .select(`
            source_id,
            pages!page_links_source_id_fkey (
              id,
              title
            )
          `)
          .eq('target_id', pageId);

        if (fallbackError) {
          console.error('Error fetching backlinks:', fallbackError);
          setBacklinks([]);
          return;
        }

        const links: Backlink[] = fallbackData?.map((link: any) => ({
          pageId: link.pages.id,
          pageTitle: link.pages.title,
          context: `Links to [[${pageTitle}]]`,
        })) || [];

        setBacklinks(links);
        return;
      }

      // Transform RPC response
      const links: Backlink[] = data?.map((link) => ({
        pageId: link.source_id,
        pageTitle: link.source_title,
        context: link.context_preview || `Links to [[${pageTitle}]]`,
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
