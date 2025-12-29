'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Page } from '@lore/db';

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  // Fetch all pages
  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPages((data as Page[]) || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

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

  // Create new page
  const createPage = useCallback(async (parentId?: string | null): Promise<Page | null> => {
    try {
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

      setPages(prev => [...prev, data as Page]);
      return data as Page;
    } catch (err) {
      console.error('Error creating page:', err);
      return null;
    }
  }, [supabase]);

  // Update page
  const updatePage = useCallback(async (pageId: string, updates: Partial<Page>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', pageId);

      if (error) throw error;

      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, ...updates } : p
      ));
      return true;
    } catch (err) {
      console.error('Error updating page:', err);
      return false;
    }
  }, [supabase]);

  // Delete page
  const deletePage = useCallback(async (pageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      // Remove page and all children from state
      const idsToRemove = new Set<string>();
      const findChildren = (id: string) => {
        idsToRemove.add(id);
        pages.filter(p => p.parent_id === id).forEach(p => findChildren(p.id));
      };
      findChildren(pageId);

      setPages(prev => prev.filter(p => !idsToRemove.has(p.id)));
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
      return false;
    }
  }, [supabase, pages]);

  // Move page to new parent
  const movePage = useCallback(async (pageId: string, newParentId: string | null): Promise<boolean> => {
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
  }, [pages, updatePage]);

  return {
    pages,
    tree: buildTree(pages),
    loading,
    error,
    createPage,
    updatePage,
    deletePage,
    movePage,
    refreshPages: fetchPages,
  };
}

export default usePages;
