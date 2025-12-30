'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for individual page view
 * Allows user to return to home or try again
 */
export default function PageError({ error, reset }: PageErrorProps) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <svg
        className="w-12 h-12 text-warm-ivory/40 mb-4"
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
      <h2 className="text-xl font-display font-semibold text-warm-ivory mb-2">
        Failed to load page
      </h2>
      <p className="text-warm-ivory/60 text-center mb-6 max-w-md">
        There was a problem loading this page. It might have been deleted or you might not have access.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-tech-olive text-void-black text-sm font-medium rounded hover:bg-tech-olive/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-warm-ivory/20 text-warm-ivory/60 text-sm font-medium rounded hover:bg-warm-ivory/5 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
