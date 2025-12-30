'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error boundary page
 * Catches errors in (app) route group
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-void-black px-4">
      <svg
        className="w-16 h-16 text-red-400 mb-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h1 className="text-2xl font-display font-bold text-warm-ivory mb-2">
        Something went wrong
      </h1>
      <p className="text-warm-ivory/60 text-center mb-6 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      {error.message && (
        <p className="text-sm text-warm-ivory/40 mb-6 font-mono bg-warm-ivory/5 px-4 py-2 rounded max-w-md truncate">
          {error.message}
        </p>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-2 border border-warm-ivory/20 text-warm-ivory/60 font-medium rounded hover:bg-warm-ivory/5 transition-colors"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
