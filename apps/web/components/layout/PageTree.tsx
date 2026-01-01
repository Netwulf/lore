/**
 * Page Tree
 * Story: E5-S3 - Memoize Tree Building + React.memo
 * Story: E6-S3 - Fix click navigation with DndKit activationConstraint
 * Story: E6-S4 - Optimize callbacks with stable references
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// LORE-4.4: Use React Query version for shared cache
import { usePagesQuery, PageTreeNode } from '@/lib/hooks/usePagesQuery';
import PageTreeItem from './PageTreeItem';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { PageTreeSkeleton } from '@/components/ui/Skeleton';

export function PageTree() {
  const { tree, loading, createPage, updatePage, deletePage, movePage } = usePagesQuery();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lore-expanded-pages');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [deleteTarget, setDeleteTarget] = useState<PageTreeNode | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // E6-S3: Sensors with activationConstraint to differentiate click vs drag
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 10px movement before starting drag
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      // Require 10px movement or 250ms delay for touch
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // E6-S4: Debounce localStorage sync to avoid excessive writes
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('lore-expanded-pages', JSON.stringify(Array.from(expandedIds)));
    }, 300);
    return () => clearTimeout(timer);
  }, [expandedIds]);

  // Get current page ID from pathname
  const currentPageId = pathname?.startsWith('/page/') ? pathname.split('/')[2] : null;

  // E6-S4: Stable callbacks that receive ID as parameter
  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    router.push(`/page/${id}`);
  }, [router]);

  const handleCreateSubpage = useCallback(async (parentId: string) => {
    const newPage = await createPage(parentId);
    if (newPage) {
      setExpandedIds(prev => new Set(Array.from(prev).concat(parentId)));
      router.push(`/page/${newPage.id}`);
    }
  }, [createPage, router]);

  const handleCreateRootPage = useCallback(async () => {
    const newPage = await createPage();
    if (newPage) {
      router.push(`/page/${newPage.id}`);
    }
  }, [createPage, router]);

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    await updatePage(id, { title: newTitle });
  }, [updatePage]);

  const handleRequestDelete = useCallback((node: PageTreeNode) => {
    setDeleteTarget(node);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      const success = await deletePage(deleteTarget.id);
      if (success && currentPageId === deleteTarget.id) {
        router.push('/');
      }
      setDeleteTarget(null);
    }
  }, [deleteTarget, deletePage, currentPageId, router]);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    await movePage(activeId, overId);
  }, [movePage]);

  if (loading) {
    return <PageTreeSkeleton />;
  }

  const renderNode = (node: PageTreeNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <PageTreeItem
          page={node}
          level={level}
          isActive={currentPageId === node.id}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggle={handleToggle}
          onSelect={handleSelect}
          onCreateSubpage={handleCreateSubpage}
          onRename={handleRename}
          onDelete={handleRequestDelete}
        />
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto">
          {/* New Page Button */}
          <button
            onClick={handleCreateRootPage}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Page
          </button>

          {/* Page Tree */}
          <div className="mt-2">
            <div className="px-3 text-xs text-warm-ivory/40 uppercase tracking-wider mb-2">
              Pages
            </div>
            <SortableContext items={tree.map(n => n.id)} strategy={verticalListSortingStrategy}>
              {tree.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.page}
                  title="No pages yet"
                  description="Start building your knowledge base"
                  action={{
                    label: "Create your first page",
                    onClick: handleCreateRootPage,
                  }}
                />
              ) : (
                tree.map(node => renderNode(node))
              )}
            </SortableContext>
          </div>
        </div>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ''}
        hasChildren={(deleteTarget?.children.length || 0) > 0}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}

export default PageTree;
