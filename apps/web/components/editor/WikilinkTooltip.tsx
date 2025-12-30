'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

interface WikilinkTooltipProps {
  pageId: string;
  pageTitle: string;
  children: React.ReactNode;
}

interface PagePreview {
  title: string;
  content: string;
  updatedAt: string;
}

/**
 * Wikilink Tooltip with Page Preview
 * Story: E3-S5 - Wikilink tooltip preview
 *
 * Shows a preview of the linked page on hover with:
 * - Page title
 * - Content excerpt
 * - Last updated timestamp
 */
export function WikilinkTooltip({ pageId, pageTitle, children }: WikilinkTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [preview, setPreview] = useState<PagePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  // Fetch page preview
  const fetchPreview = useCallback(async () => {
    if (preview) return; // Already fetched

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('title, content, updated_at')
        .eq('id', pageId)
        .single();

      if (!error && data) {
        // Extract text from BlockNote content
        const contentText = extractTextFromContent(data.content);
        setPreview({
          title: data.title,
          content: contentText.slice(0, 200) + (contentText.length > 200 ? '...' : ''),
          updatedAt: new Date(data.updated_at).toLocaleDateString(),
        });
      }
    } catch (err) {
      console.error('Error fetching page preview:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId, preview, supabase]);

  // Extract text from BlockNote JSON content
  const extractTextFromContent = (content: any): string => {
    if (!content || !Array.isArray(content)) return '';

    let text = '';
    const traverse = (node: any) => {
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };

    content.forEach(traverse);
    return text.trim();
  };

  // Update tooltip position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 150;

    // Calculate position - prefer below and right
    let top = rect.bottom + 8;
    let left = rect.left;

    // Adjust if off-screen
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 16;
    }
    if (top + tooltipHeight > window.innerHeight) {
      top = rect.top - tooltipHeight - 8;
    }

    setPosition({ top, left });
  }, []);

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
      fetchPreview();
    }, 300); // 300ms delay before showing
  }, [fetchPreview, updatePosition]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100); // 100ms delay before hiding
  }, []);

  // Handle tooltip mouse enter (keep visible)
  const handleTooltipMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline"
      >
        {children}
      </span>

      {isVisible &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
            className="w-[300px] bg-twilight-deep border border-warm-ivory/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-warm-ivory/10">
              <div className="flex items-center gap-2">
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
                <span className="text-sm font-medium text-warm-ivory truncate">
                  {preview?.title || pageTitle}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="px-3 py-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-warm-ivory/5 rounded animate-pulse w-full" />
                  <div className="h-3 bg-warm-ivory/5 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-warm-ivory/5 rounded animate-pulse w-1/2" />
                </div>
              ) : preview?.content ? (
                <p className="text-xs text-warm-ivory/60 line-clamp-4">
                  {preview.content}
                </p>
              ) : (
                <p className="text-xs text-warm-ivory/40 italic">
                  No content yet
                </p>
              )}
            </div>

            {/* Footer */}
            {preview?.updatedAt && (
              <div className="px-3 py-1.5 border-t border-warm-ivory/10 bg-warm-ivory/5">
                <span className="text-[10px] text-warm-ivory/30">
                  Updated {preview.updatedAt}
                </span>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

export default WikilinkTooltip;
