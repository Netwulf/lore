/**
 * Tags Hook
 * Story: LORE-3.7 - AI Auto-Tagging
 *
 * Manages tags for the current user - CRUD operations and tag suggestions
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Tag {
  id: string;
  name: string;
  color: string;
  page_count?: number;
}

export interface TagSuggestion {
  name: string;
  isExisting: boolean;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch all user tags with counts
  const fetchTags = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await (supabase as any).rpc('get_tags_with_counts', {
      p_user_id: user.id,
    });

    if (!error && data) {
      setTags(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Create a new tag
  const createTag = useCallback(async (name: string, color?: string): Promise<Tag | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await (supabase as any)
      .from('tags')
      .insert({
        name: name.toLowerCase().trim(),
        user_id: user.id,
        color: color || '#8dc75e',
      })
      .select()
      .single();

    if (error) {
      // Tag might already exist
      if (error.code === '23505') {
        const { data: existingTag } = await (supabase as any)
          .from('tags')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', name.toLowerCase().trim())
          .single();
        return existingTag;
      }
      console.error('Error creating tag:', error);
      return null;
    }

    await fetchTags();
    return data;
  }, [supabase, fetchTags]);

  // Delete a tag
  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }

    await fetchTags();
    return true;
  }, [supabase, fetchTags]);

  // Add tag to page
  const addTagToPage = useCallback(async (pageId: string, tagId: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('page_tags')
      .insert({ page_id: pageId, tag_id: tagId });

    if (error && error.code !== '23505') {
      console.error('Error adding tag to page:', error);
      return false;
    }

    await fetchTags();
    return true;
  }, [supabase, fetchTags]);

  // Remove tag from page
  const removeTagFromPage = useCallback(async (pageId: string, tagId: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('page_tags')
      .delete()
      .eq('page_id', pageId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag from page:', error);
      return false;
    }

    await fetchTags();
    return true;
  }, [supabase, fetchTags]);

  // Get tags for a specific page
  const getPageTags = useCallback(async (pageId: string): Promise<Tag[]> => {
    const { data, error } = await (supabase as any)
      .from('page_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('page_id', pageId);

    if (error) {
      console.error('Error fetching page tags:', error);
      return [];
    }

    return data?.map((pt: any) => pt.tags).filter(Boolean) || [];
  }, [supabase]);

  // Request AI tag suggestions for a page
  const suggestTags = useCallback(async (pageId: string, content: unknown): Promise<TagSuggestion[]> => {
    try {
      const response = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get suggestions');
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting tag suggestions:', error);
      return [];
    }
  }, []);

  // Apply multiple tag suggestions to a page
  const applyTagSuggestions = useCallback(async (
    pageId: string,
    suggestions: { name: string; selected: boolean }[]
  ): Promise<boolean> => {
    const selectedTags = suggestions.filter(s => s.selected);

    for (const suggestion of selectedTags) {
      // Create or get existing tag
      let tag: Tag | null | undefined = tags.find(t => t.name === suggestion.name);
      if (!tag) {
        tag = await createTag(suggestion.name);
      }

      if (tag) {
        await addTagToPage(pageId, tag.id);
      }
    }

    return true;
  }, [tags, createTag, addTagToPage]);

  return {
    tags,
    loading,
    createTag,
    deleteTag,
    addTagToPage,
    removeTagFromPage,
    getPageTags,
    suggestTags,
    applyTagSuggestions,
    refetch: fetchTags,
  };
}

export default useTags;
