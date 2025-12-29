'use client';

/**
 * Tags Sidebar Section
 * Story: LORE-3.7 - AI Auto-Tagging
 *
 * Shows all user tags with counts in the sidebar
 */

import { useState } from 'react';
import Link from 'next/link';
import { useTags, type Tag } from '@/lib/hooks/useTags';

interface TagsSidebarProps {
  selectedTagId?: string;
  onTagSelect?: (tagId: string | null) => void;
}

export function TagsSidebar({ selectedTagId, onTagSelect }: TagsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { tags, loading } = useTags();

  const handleTagClick = (tag: Tag) => {
    if (onTagSelect) {
      onTagSelect(selectedTagId === tag.id ? null : tag.id);
    }
  };

  return (
    <div className="py-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-warm-ivory/60 hover:text-warm-ivory transition-colors"
      >
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4" />
          <span>Tags</span>
        </div>
        <ChevronIcon
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {/* Tags list */}
      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {loading ? (
            <div className="px-3 py-2 text-sm text-warm-ivory/40">
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="px-3 py-2 text-sm text-warm-ivory/40">
              No tags yet
            </div>
          ) : (
            tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedTagId === tag.id
                    ? 'bg-tech-olive/20 text-tech-olive'
                    : 'text-warm-ivory/70 hover:bg-warm-ivory/5 hover:text-warm-ivory'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate">{tag.name}</span>
                </div>
                <span className="text-xs text-warm-ivory/40 flex-shrink-0">
                  {tag.page_count || 0}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
    />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default TagsSidebar;
