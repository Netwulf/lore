'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';
import { createClient } from '@/lib/supabase/client';
import { usePages } from '@/lib/hooks/usePages';
import { useLinks } from '@/lib/hooks/useLinks';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import type { PartialBlock } from '@blocknote/core';
import type { Json } from '@lore/db';
import type { WikiPage } from '@lore/editor';
import { BacklinksPanel } from './BacklinksPanel';
import { RelatedSuggestionsPanel } from './RelatedSuggestionsPanel';
import { InlineAIToolbar } from './InlineAIToolbar';
import { PageTags } from './PageTags';
import { TagSuggestionsPopup } from './TagSuggestionsPopup';
import { ImageGenerationModal } from './ImageGenerationModal';

// Dynamic import to avoid SSR issues with BlockNote
const Editor = dynamic(() => import('@lore/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-warm-ivory/40">Loading editor...</div>
    </div>
  ),
});

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface PageEditorProps {
  pageId: string;
  initialContent?: PartialBlock[];
  initialTitle?: string;
}

export function PageEditor({ pageId, initialContent, initialTitle = 'Untitled' }: PageEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingReplacement, setPendingReplacement] = useState<string | null>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentContent, setCurrentContent] = useState<PartialBlock[] | undefined>(initialContent);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { pages, createPage } = usePages();
  const { syncLinks } = useLinks();

  // Text selection for AI inline actions
  const { selection, clearSelection, hasSelection } = useTextSelection({
    containerRef: editorContainerRef,
    minLength: 10,
    enabled: true,
  });

  // Get current user ID for link syncing
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, [supabase]);

  // Convert pages to WikiPage format for the editor
  const wikiPages: WikiPage[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    parent_id: p.parent_id,
  }));

  // Handler for creating new pages from wiki link autocomplete
  const handleCreatePage = useCallback(
    async (newTitle: string): Promise<WikiPage | null> => {
      const newPage = await createPage(pageId); // Create as sibling
      if (newPage) {
        // Update the title
        const { error } = await supabase
          .from('pages')
          .update({ title: newTitle })
          .eq('id', newPage.id);

        if (!error) {
          return {
            id: newPage.id,
            title: newTitle,
            parent_id: newPage.parent_id,
          };
        }
      }
      return null;
    },
    [createPage, pageId, supabase]
  );

  // Debounced save for content
  const debouncedSaveContent = useDebouncedCallback(
    async (content: PartialBlock[]) => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('pages')
          .update({
            content: content as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pageId);

        if (error) throw error;

        // Sync wiki links to database
        if (userId) {
          await syncLinks(pageId, content, userId);
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSaveTitle(newTitle);
  };

  const handleContentChange = useCallback(
    (content: PartialBlock[]) => {
      setCurrentContent(content);
      debouncedSaveContent(content);
    },
    [debouncedSaveContent]
  );

  // Handle AI inline action result - replace selected text
  const handleInlineApply = useCallback((newText: string) => {
    // Replace selected text in the document using execCommand (works with contenteditable)
    // This uses the browser's built-in text replacement which integrates with undo stack
    const windowSelection = window.getSelection();
    if (windowSelection && !windowSelection.isCollapsed) {
      // Use execCommand for undo support
      document.execCommand('insertText', false, newText);
    }
    clearSelection();
  }, [clearSelection]);

  const handleInlineCancel = useCallback(() => {
    clearSelection();
    // Clear browser selection
    window.getSelection()?.removeAllRanges();
  }, [clearSelection]);

  // Handle image insertion from AI generation
  const handleImageInsert = useCallback((imageUrl: string, alt?: string) => {
    // Insert image as an HTML img element using execCommand
    // This is a simple approach that works with contenteditable
    const imgHtml = `<img src="${imageUrl}" alt="${alt || 'AI generated image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />`;
    document.execCommand('insertHTML', false, imgHtml);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Save Status */}
      <div className="flex justify-end mb-4 h-6">
        {saveStatus === 'saving' && (
          <span className="text-sm text-warm-ivory/40 flex items-center gap-2">
            <span className="w-2 h-2 bg-tech-olive rounded-full animate-pulse" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-sm text-tech-olive flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Error saving
          </span>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full text-4xl font-display font-bold text-warm-ivory bg-transparent border-none outline-none placeholder:text-warm-ivory/30 mb-4"
      />

      {/* Tags */}
      <PageTags
        pageId={pageId}
        onRequestSuggestions={() => setShowTagSuggestions(true)}
      />

      {/* Editor with AI Inline Actions */}
      <div ref={editorContainerRef} className="relative">
        <Editor
          initialContent={initialContent}
          onChange={handleContentChange}
          editable={true}
          pages={wikiPages}
          onCreatePage={handleCreatePage}
          onImageCommand={() => setShowImageModal(true)}
        />

        {/* AI Inline Actions Toolbar */}
        {hasSelection && selection && (
          <InlineAIToolbar
            selectedText={selection.text}
            position={selection.position}
            onApply={handleInlineApply}
            onCancel={handleInlineCancel}
          />
        )}
      </div>

      {/* Related Suggestions Panel */}
      <RelatedSuggestionsPanel pageId={pageId} pageTitle={title} />

      {/* Backlinks Panel */}
      <BacklinksPanel pageId={pageId} pageTitle={title} />

      {/* Tag Suggestions Popup */}
      {showTagSuggestions && currentContent && (
        <TagSuggestionsPopup
          pageId={pageId}
          content={currentContent}
          onClose={() => setShowTagSuggestions(false)}
        />
      )}

      {/* Image Generation Modal */}
      {showImageModal && (
        <ImageGenerationModal
          onInsert={handleImageInsert}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
}

export default PageEditor;
