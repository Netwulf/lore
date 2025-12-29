'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PartialBlock } from '@blocknote/core';

export interface PageLink {
  id: string;
  source_id: string;
  target_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Extract wiki link page IDs from BlockNote content
 */
function extractLinksFromContent(content: PartialBlock[]): string[] {
  const links: string[] = [];

  const traverse = (node: any) => {
    // Check if this is a wikiLink inline content
    if (node.type === 'wikiLink' && node.props?.pageId) {
      links.push(node.props.pageId);
    }

    // Traverse content array (blocks have content)
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }

    // Traverse children array (for nested blocks)
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  };

  content.forEach(traverse);

  // Return unique links
  return Array.from(new Set(links));
}

export function useLinks() {
  const supabase = createClient();

  /**
   * Sync links for a page - extracts from content and updates database
   */
  const syncLinks = useCallback(
    async (
      pageId: string,
      content: PartialBlock[],
      userId: string
    ): Promise<boolean> => {
      try {
        const newLinkTargets = extractLinksFromContent(content);

        // Get existing links from database
        const { data: existingLinks, error: fetchError } = await supabase
          .from('page_links')
          .select('target_id')
          .eq('source_id', pageId);

        if (fetchError) {
          console.error('Error fetching existing links:', fetchError);
          return false;
        }

        const existingTargets = existingLinks?.map((l) => l.target_id) || [];

        // Calculate what to delete and insert
        const toDelete = existingTargets.filter(
          (id) => !newLinkTargets.includes(id)
        );
        const toInsert = newLinkTargets.filter(
          (id) => !existingTargets.includes(id)
        );

        // Delete removed links
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('page_links')
            .delete()
            .eq('source_id', pageId)
            .in('target_id', toDelete);

          if (deleteError) {
            console.error('Error deleting links:', deleteError);
          }
        }

        // Insert new links
        if (toInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('page_links')
            .insert(
              toInsert.map((targetId) => ({
                source_id: pageId,
                target_id: targetId,
                user_id: userId,
              }))
            );

          if (insertError) {
            console.error('Error inserting links:', insertError);
          }
        }

        return true;
      } catch (err) {
        console.error('Error syncing links:', err);
        return false;
      }
    },
    [supabase]
  );

  /**
   * Get backlinks for a page (pages that link TO this page)
   */
  const getBacklinks = useCallback(
    async (pageId: string) => {
      const { data, error } = await supabase
        .from('page_links')
        .select(
          `
          source_id,
          pages!page_links_source_id_fkey (
            id,
            title
          )
        `
        )
        .eq('target_id', pageId);

      if (error) {
        console.error('Error fetching backlinks:', error);
        return [];
      }

      return (
        data?.map((link: any) => ({
          id: link.pages.id,
          title: link.pages.title,
        })) || []
      );
    },
    [supabase]
  );

  /**
   * Get outgoing links from a page
   */
  const getOutgoingLinks = useCallback(
    async (pageId: string) => {
      const { data, error } = await supabase
        .from('page_links')
        .select(
          `
          target_id,
          pages!page_links_target_id_fkey (
            id,
            title
          )
        `
        )
        .eq('source_id', pageId);

      if (error) {
        console.error('Error fetching outgoing links:', error);
        return [];
      }

      return (
        data?.map((link: any) => ({
          id: link.pages.id,
          title: link.pages.title,
        })) || []
      );
    },
    [supabase]
  );

  return {
    syncLinks,
    getBacklinks,
    getOutgoingLinks,
    extractLinksFromContent,
  };
}

export default useLinks;
