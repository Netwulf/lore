'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { usePages, PageTreeNode } from '@/lib/hooks/usePages';
import PageTreeItem from './PageTreeItem';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { PageTreeSkeleton } from '@/components/ui/Skeleton';

export function PageTree() {
  const { tree, loading, createPage, updatePage, deletePage, movePage } = usePages();
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

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('lore-expanded-pages', JSON.stringify(Array.from(expandedIds)));
  }, [expandedIds]);

  // Get current page ID from pathname
  const currentPageId = pathname?.startsWith('/page/') ? pathname.split('/')[2] : null;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreatePage = async (parentId?: string) => {
    const newPage = await createPage(parentId);
    if (newPage) {
      if (parentId) {
        setExpandedIds(prev => new Set(Array.from(prev).concat(parentId)));
      }
      router.push(`/page/${newPage.id}`);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    await updatePage(id, { title: newTitle });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      const success = await deletePage(deleteTarget.id);
      if (success && currentPageId === deleteTarget.id) {
        router.push('/');
      }
      setDeleteTarget(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // For now, simple move to root or under another page
    // TODO: Implement proper reordering
    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a page, make it a child
    await movePage(activeId, overId);
  };

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
          onToggle={() => toggleExpand(node.id)}
          onSelect={() => router.push(`/page/${node.id}`)}
          onCreateSubpage={() => handleCreatePage(node.id)}
          onRename={(newTitle) => handleRename(node.id, newTitle)}
          onDelete={() => setDeleteTarget(node)}
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
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-y-auto">
          {/* New Page Button */}
          <button
            onClick={() => handleCreatePage()}
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
                    onClick: () => handleCreatePage(),
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
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default PageTree;
