'use client';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
}

/**
 * Visual indicator for page save status
 */
export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === 'idle') return <div className="h-6" />;

  return (
    <div className="flex justify-end mb-4 h-6">
      {status === 'saving' && (
        <span className="text-sm text-warm-ivory/40 flex items-center gap-2">
          <span className="w-2 h-2 bg-tech-olive rounded-full animate-pulse" />
          Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="text-sm text-tech-olive flex items-center gap-2">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved
        </span>
      )}
      {status === 'error' && (
        <span className="text-sm text-red-400 flex items-center gap-2">
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
          Error saving
        </span>
      )}
    </div>
  );
}
