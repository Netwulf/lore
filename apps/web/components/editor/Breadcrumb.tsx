'use client';

import { useMemo, Fragment } from 'react';
import Link from 'next/link';
import type { Page } from '@lore/db';

interface BreadcrumbProps {
  pageId: string;
  pages: Page[];
  maxItems?: number;
}

/**
 * Breadcrumb navigation showing page hierarchy
 * Displays: Home > Parent > ... > Current
 */
export function Breadcrumb({ pageId, pages, maxItems = 4 }: BreadcrumbProps) {
  const path = useMemo(() => {
    const result: Page[] = [];
    let current = pages.find((p) => p.id === pageId);

    while (current) {
      result.unshift(current);
      current = pages.find((p) => p.id === current?.parent_id);
    }

    return result;
  }, [pageId, pages]);

  // Don't show breadcrumb for root pages
  if (path.length <= 1) {
    return null;
  }

  // Truncate middle items if path is too long
  const shouldTruncate = path.length > maxItems;
  const displayPath = shouldTruncate
    ? [path[0], ...path.slice(-2)]
    : path;

  return (
    <nav
      className="flex items-center gap-1.5 text-sm mb-4 overflow-hidden"
      aria-label="Breadcrumb"
    >
      {/* Home icon */}
      <Link
        href="/"
        className="text-warm-ivory/40 hover:text-warm-ivory transition-colors flex-shrink-0"
        title="Home"
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </Link>

      {displayPath.map((page, index) => {
        const isLast = index === displayPath.length - 1;
        const showEllipsis = shouldTruncate && index === 0;

        return (
          <Fragment key={page.id}>
            {/* Separator */}
            <svg
              className="w-3 h-3 text-warm-ivory/20 flex-shrink-0"
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

            {/* Ellipsis for truncated items */}
            {showEllipsis && (
              <>
                <span className="text-warm-ivory/30">...</span>
                <svg
                  className="w-3 h-3 text-warm-ivory/20 flex-shrink-0"
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
              </>
            )}

            {/* Page link or current page */}
            {isLast ? (
              <span className="text-warm-ivory/60 truncate max-w-[200px]">
                {page.title || 'Untitled'}
              </span>
            ) : (
              <Link
                href={`/page/${page.id}`}
                className="text-warm-ivory/40 hover:text-warm-ivory transition-colors truncate max-w-[150px]"
                title={page.title}
              >
                {page.title || 'Untitled'}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
