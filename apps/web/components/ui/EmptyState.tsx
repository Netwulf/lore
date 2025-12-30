'use client';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable Empty State Component
 * Story: E3-S3 - Empty states sidebar
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'px-3 py-4',
      icon: 'w-8 h-8 mb-2',
      title: 'text-sm',
      description: 'text-xs',
      button: 'text-xs px-2 py-1',
    },
    md: {
      container: 'px-4 py-8',
      icon: 'w-10 h-10 mb-3',
      title: 'text-sm',
      description: 'text-xs',
      button: 'text-sm px-3 py-1.5',
    },
    lg: {
      container: 'px-6 py-12',
      icon: 'w-12 h-12 mb-4',
      title: 'text-base',
      description: 'text-sm',
      button: 'text-sm px-4 py-2',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.container} text-center`}>
      {icon && (
        <div className={`${classes.icon} mx-auto text-warm-ivory/20`}>
          {icon}
        </div>
      )}
      <p className={`${classes.title} text-warm-ivory/40 mb-1`}>{title}</p>
      {description && (
        <p className={`${classes.description} text-warm-ivory/30 mb-3`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={`${classes.button} text-tech-olive hover:text-tech-olive/80 transition-colors`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Common empty state icons
export const EmptyStateIcons = {
  page: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  tag: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
  link: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
  search: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  graph: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
};

export default EmptyState;
