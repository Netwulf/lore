import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { createClient } from '@/lib/supabase/client';
import { useLinks } from '@/lib/hooks/useLinks';
import type { PartialBlock } from '@blocknote/core';
import type { Json } from '@lore/db';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UsePageSaveOptions {
  pageId: string;
  initialTitle?: string;
  initialContent?: PartialBlock[];
}

interface UsePageSaveReturn {
  title: string;
  setTitle: (title: string) => void;
  content: PartialBlock[] | undefined;
  setContent: (content: PartialBlock[]) => void;
  saveStatus: SaveStatus;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleContentChange: (content: PartialBlock[]) => void;
}

/**
 * Hook to manage page save state and persistence
 * Handles debounced saves for both title and content
 */
export function usePageSave({
  pageId,
  initialTitle = 'Untitled',
  initialContent,
}: UsePageSaveOptions): UsePageSaveReturn {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<PartialBlock[] | undefined>(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [userId, setUserId] = useState<string | null>(null);

  // LORE-4.1: Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const { syncLinks } = useLinks();

  // Get current user ID for link syncing
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Debounced save for content
  const debouncedSaveContent = useDebouncedCallback(
    async (newContent: PartialBlock[]) => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('pages')
          .update({
            content: newContent as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pageId);

        if (error) throw error;

        // Sync wiki links to database
        if (userId) {
          await syncLinks(pageId, newContent, userId);
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      }
    },
    1000
  );

  // Debounced save for title
  const debouncedSaveTitle = useDebouncedCallback(
    async (newTitle: string) => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('pages')
          .update({
            title: newTitle,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pageId);

        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      }
    },
    1000
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      debouncedSaveTitle(newTitle);
    },
    [debouncedSaveTitle]
  );

  const handleContentChange = useCallback(
    (newContent: PartialBlock[]) => {
      setContent(newContent);
      debouncedSaveContent(newContent);
    },
    [debouncedSaveContent]
  );

  return {
    title,
    setTitle,
    content,
    setContent,
    saveStatus,
    handleTitleChange,
    handleContentChange,
  };
}
