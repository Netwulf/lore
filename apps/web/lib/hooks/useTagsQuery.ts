'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  page_count?: number;
  created_at: string;
}

// Query keys for cache management
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  pageTags: (pageId: string) => [...tagKeys.all, 'page', pageId] as const,
};

/**
 * React Query version of useTags
 * Story: E4-S4 - React Query caching
 *
 * Provides cached tag management with optimistic updates
 */
export function useTagsQuery() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all tags using RPC for counts
  const {
    data: tags = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: tagKeys.lists(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any).rpc('get_tags_with_counts', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data || []) as Tag[];
    },
  });

  // Get tags for a specific page
  const getPageTags = async (pageId: string): Promise<Tag[]> => {
    const { data, error } = await (supabase as any)
      .from('page_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('page_id', pageId);

    if (error) {
      console.error('Error fetching page tags:', error);
      return [];
    }

    return (data || []).map((pt: any) => pt.tags).filter(Boolean) as Tag[];
  };

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('tags')
        .insert({
          name: name.toLowerCase().trim(),
          user_id: user.id,
          color: '#8dc75e',
        })
        .select()
        .single();

      if (error) {
        // Tag might already exist - return existing
        if (error.code === '23505') {
          const { data: existingTag } = await (supabase as any)
            .from('tags')
            .select('*')
            .eq('user_id', user.id)
            .eq('name', name.toLowerCase().trim())
            .single();
          return existingTag as Tag;
        }
        throw error;
      }
      return data as Tag;
    },
    onSuccess: (newTag) => {
      queryClient.setQueryData<Tag[]>(tagKeys.lists(), (old) => {
        const exists = old?.some(t => t.id === newTag.id);
        if (exists) return old;
        return old ? [...old, { ...newTag, page_count: 0 }] : [{ ...newTag, page_count: 0 }];
      });
    },
  });

  // Add tag to page mutation
  const addTagToPageMutation = useMutation({
    mutationFn: async ({ pageId, tagId }: { pageId: string; tagId: string }) => {
      const { error } = await (supabase as any)
        .from('page_tags')
        .insert({ page_id: pageId, tag_id: tagId });

      // Ignore duplicate errors
      if (error && error.code !== '23505') throw error;
      return { pageId, tagId };
    },
    onSuccess: ({ tagId }) => {
      // Increment page_count for the tag
      queryClient.setQueryData<Tag[]>(tagKeys.lists(), (old) => {
        return old?.map(t =>
          t.id === tagId ? { ...t, page_count: (t.page_count || 0) + 1 } : t
        );
      });
    },
  });

  // Remove tag from page mutation
  const removeTagFromPageMutation = useMutation({
    mutationFn: async ({ pageId, tagId }: { pageId: string; tagId: string }) => {
      const { error } = await (supabase as any)
        .from('page_tags')
        .delete()
        .eq('page_id', pageId)
        .eq('tag_id', tagId);

      if (error) throw error;
      return { pageId, tagId };
    },
    onSuccess: ({ tagId }) => {
      // Decrement page_count for the tag
      queryClient.setQueryData<Tag[]>(tagKeys.lists(), (old) => {
        return old?.map(t =>
          t.id === tagId ? { ...t, page_count: Math.max((t.page_count || 0) - 1, 0) } : t
        );
      });
    },
  });

  // Wrapper functions for backward compatibility
  const createTag = async (name: string): Promise<Tag | null> => {
    try {
      return await createTagMutation.mutateAsync(name);
    } catch (err) {
      console.error('Error creating tag:', err);
      return null;
    }
  };

  const addTagToPage = async (pageId: string, tagId: string): Promise<boolean> => {
    try {
      await addTagToPageMutation.mutateAsync({ pageId, tagId });
      return true;
    } catch (err) {
      console.error('Error adding tag to page:', err);
      return false;
    }
  };

  const removeTagFromPage = async (pageId: string, tagId: string): Promise<boolean> => {
    try {
      await removeTagFromPageMutation.mutateAsync({ pageId, tagId });
      return true;
    } catch (err) {
      console.error('Error removing tag from page:', err);
      return false;
    }
  };

  return {
    tags,
    loading,
    error: error as Error | null,
    getPageTags,
    createTag,
    addTagToPage,
    removeTagFromPage,
  };
}

export default useTagsQuery;
