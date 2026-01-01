/**
 * Page Tree Item
 * Story: E5-S3 - Memoize Tree Building + React.memo
 * Story: E6-S4 - Stable callbacks that receive ID as parameter
 */
'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Page } from '@lore/db';
import type { PageTreeNode } from '@/lib/hooks/usePagesQuery';

// E6-S4: Props now receive stable callbacks that take ID
interface PageTreeItemProps {
  page: Page | PageTreeNode;
  level: number;
  isActive: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCreateSubpage: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (node: PageTreeNode) => void;
}

function PageTreeItemComponent({
  page,
  level,
  isActive,
  isExpanded,
  hasChildren,
  onToggle,
  onSelect,
  onCreateSubpage,
  onRename,
  onDelete,
}: PageTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${level * 16 + 8}px`,
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditTitle(page.title);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== page.title) {
      onRename(page.id, editTitle.trim());
    } else {
      setEditTitle(page.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(page.title);
      setIsEditing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // E6-S4: Click handlers now pass ID to stable callbacks
  const handleClick = () => {
    onSelect(page.id);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(page.id);
  };

  const handleCreateSubpageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSubpage(page.id);
  };

  return (
    <div ref={itemRef}>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group flex items-center gap-1 py-1 pr-2 text-sm cursor-pointer
          ${isActive ? 'bg-warm-ivory/10 text-warm-ivory' : 'text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5'}
          transition-colors
        `}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        {...attributes}
        {...listeners}
      >
        {/* Expand/Collapse */}
        <button
          onClick={handleToggleClick}
          className={`w-4 h-4 flex items-center justify-center transition-transform ${
            hasChildren ? 'visible' : 'invisible'
          }`}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Page Icon */}
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border border-tech-olive/50 px-1 outline-none text-warm-ivory"
          />
        ) : (
          <span className="flex-1 truncate">{page.title}</span>
        )}

        {/* Actions (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={handleCreateSubpageClick}
            className="w-5 h-5 flex items-center justify-center text-warm-ivory/40 hover:text-warm-ivory"
            title="Add subpage"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-twilight-deep border border-warm-ivory/10 py-1 z-50 min-w-[150px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button
            onClick={() => {
              setIsEditing(true);
              setShowContextMenu(false);
            }}
            className="w-full px-3 py-1.5 text-sm text-warm-ivory/80 hover:bg-warm-ivory/10 text-left"
          >
            Rename
          </button>
          <button
            onClick={() => {
              onCreateSubpage(page.id);
              setShowContextMenu(false);
            }}
            className="w-full px-3 py-1.5 text-sm text-warm-ivory/80 hover:bg-warm-ivory/10 text-left"
          >
            Add subpage
          </button>
          <div className="border-t border-warm-ivory/10 my-1" />
          <button
            onClick={() => {
              onDelete(page as PageTreeNode);
              setShowContextMenu(false);
            }}
            className="w-full px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 text-left"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// E5-S3: React.memo with custom comparison to prevent unnecessary re-renders
// E6-S4: Callbacks are now stable, so we don't need to compare them
export const PageTreeItem = memo(PageTreeItemComponent, (prev, next) => {
  return (
    prev.page.id === next.page.id &&
    prev.page.title === next.page.title &&
    prev.level === next.level &&
    prev.isActive === next.isActive &&
    prev.isExpanded === next.isExpanded &&
    prev.hasChildren === next.hasChildren
  );
});

export default PageTreeItem;
