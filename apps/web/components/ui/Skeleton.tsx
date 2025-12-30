'use client';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component for loading states
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-warm-ivory/5 rounded ${className}`}
      style={style}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Page tree skeleton for sidebar
 */
export function PageTreeSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-1/2 ml-4" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-6 w-1/2 ml-4" />
      <Skeleton className="h-6 w-3/5" />
    </div>
  );
}

/**
 * Editor skeleton for page loading
 */
export function EditorSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Title skeleton */}
      <Skeleton className="h-10 w-1/2 mb-6" />
      {/* Content skeleton */}
      <div className="space-y-4">
        <SkeletonText lines={2} />
        <Skeleton className="h-32 w-full" />
        <SkeletonText lines={3} />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

/**
 * Tag list skeleton
 */
export function TagsSkeleton() {
  return (
    <div className="space-y-1.5 px-3 py-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
