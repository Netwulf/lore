'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Page } from '@lore/db';

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

// Query keys for cache management
export const pageKeys = {
  all: ['pages'] as const,
  lists: () => [...pageKeys.all, 'list'] as const,
  list: (userId: string) => [...pageKeys.lists(), userId] as const,
  details: () => [...pageKeys.all, 'detail'] as const,
  detail: (id: string) => [...pageKeys.details(), id] as const,
};

/**
 * React Query version of usePages
 * Story: E4-S4 - React Query caching
 *
 * Benefits over vanilla usePages:
 * - Automatic caching (5 min stale time)
 * - Background refetching
 * - Optimistic updates for mutations
 * - Automatic retry on failure
 * - Shared cache across components
 */
export function usePagesQuery() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all pages
  const {
    data: pages = [],
    isLoading: loading,
    error,
    refetch: refreshPages,
  } = useQuery({
    queryKey: pageKeys.lists(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as Page[]) || [];
    },
  });

  // Build tree structure
  const buildTree = useCallback((pages: Page[]): PageTreeNode[] => {
    const map = new Map<string, PageTreeNode>();
    const roots: PageTreeNode[] = [];

    // First pass: create nodes
    pages.forEach(page => {
      map.set(page.id, { ...page, children: [] });
    });

    // Second pass: build tree
    pages.forEach(page => {
      const node = map.get(page.id)!;
      if (page.parent_id && map.has(page.parent_id)) {
        map.get(page.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, []);

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (parentId?: string | null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pages')
        .insert({
          title: 'Untitled',
          content: {},
          parent_id: parentId || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Page;
    },
    onSuccess: (newPage) => {
      // Optimistically update cache
      queryClient.setQueryData<Page[]>(pageKeys.lists(), (old) => {
        return old ? [...old, newPage] : [newPage];
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ pageId, updates }: { pageId: string; updates: Partial<Page> }) => {
      const { error } = await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', pageId);

      if (error) throw error;
      return { pageId, updates };
    },
    onSuccess: ({ pageId, updates }) => {
      // Optimistically update cache
      queryClient.setQueryData<Page[]>(pageKeys.lists(), (old) => {
        return old?.map(p => p.id === pageId ? { ...p, ...updates } : p);
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      return pageId;
    },
    onSuccess: (deletedId) => {
      // Find all children to remove
      const idsToRemove = new Set<string>();
      const findChildren = (id: string) => {
        idsToRemove.add(id);
        pages.filter(p => p.parent_id === id).forEach(p => findChildren(p.id));
      };
      findChildren(deletedId);

      // Update cache
      queryClient.setQueryData<Page[]>(pageKeys.lists(), (old) => {
        return old?.filter(p => !idsToRemove.has(p.id));
      });
    },
  });

  // Wrapper functions for backward compatibility
  const createPage = async (parentId?: string | null): Promise<Page | null> => {
    try {
      return await createPageMutation.mutateAsync(parentId);
    } catch (err) {
      console.error('Error creating page:', err);
      return null;
    }
  };

  const updatePage = async (pageId: string, updates: Partial<Page>): Promise<boolean> => {
    try {
      await updatePageMutation.mutateAsync({ pageId, updates });
      return true;
    } catch (err) {
      console.error('Error updating page:', err);
      return false;
    }
  };

  const deletePage = async (pageId: string): Promise<boolean> => {
    try {
      await deletePageMutation.mutateAsync(pageId);
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
      return false;
    }
  };

  const movePage = async (pageId: string, newParentId: string | null): Promise<boolean> => {
    // Prevent moving page to its own descendant
    const isDescendant = (checkId: string, parentId: string | null): boolean => {
      if (!parentId) return false;
      if (parentId === checkId) return true;
      const parent = pages.find(p => p.id === parentId);
      return parent ? isDescendant(checkId, parent.parent_id) : false;
    };

    if (newParentId && isDescendant(pageId, newParentId)) {
      console.error('Cannot move page to its own descendant');
      return false;
    }

    return updatePage(pageId, { parent_id: newParentId });
  };

  return {
    pages,
    tree: buildTree(pages),
    loading,
    error: error as Error | null,
    createPage,
    updatePage,
    deletePage,
    movePage,
    refreshPages: () => refreshPages(),
    // Expose mutation states for UI feedback
    isCreating: createPageMutation.isPending,
    isUpdating: updatePageMutation.isPending,
    isDeleting: deletePageMutation.isPending,
  };
}

export default usePagesQuery;
