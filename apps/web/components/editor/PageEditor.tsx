'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { usePages } from '@/lib/hooks/usePages';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { useAIEnabled } from '@/lib/hooks/useAIEnabled';
import { usePageSave } from '@/lib/hooks/usePageSave';
import type { PartialBlock } from '@blocknote/core';
import type { WikiPage } from '@lore/editor';
import { RelatedSuggestionsPanel } from './RelatedSuggestionsPanel';
import { InlineAIToolbar } from './InlineAIToolbar';
import { ImageGenerationModal } from './ImageGenerationModal';
import { Breadcrumb } from './Breadcrumb';
import { SaveIndicator } from './SaveIndicator';

// Dynamic import to avoid SSR issues with BlockNote
const Editor = dynamic(() => import('@lore/editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-warm-ivory/40">Loading editor...</div>
    </div>
  ),
});

interface PageEditorProps {
  pageId: string;
  initialContent?: PartialBlock[];
  initialTitle?: string;
}

export function PageEditor({ pageId, initialContent, initialTitle = 'Untitled' }: PageEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { pages, createPage } = usePages();
  const { enabled: aiEnabled } = useAIEnabled();

  // Page save state and handlers
  const { title, saveStatus, handleTitleChange, handleContentChange } = usePageSave({
    pageId,
    initialTitle,
    initialContent,
  });

  // Text selection for AI inline actions
  const { selection, clearSelection, hasSelection } = useTextSelection({
    containerRef: editorContainerRef,
    minLength: 10,
    enabled: true,
  });

  // Convert pages to WikiPage format for the editor
  const wikiPages: WikiPage[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    parent_id: p.parent_id,
  }));

  // Handler for creating new pages from wiki link autocomplete
  const handleCreatePage = useCallback(
    async (newTitle: string): Promise<WikiPage | null> => {
      const newPage = await createPage(pageId);
      if (newPage) {
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

  // Handle AI inline action result
  const handleInlineApply = useCallback((newText: string) => {
    const windowSelection = window.getSelection();
    if (windowSelection && !windowSelection.isCollapsed) {
      document.execCommand('insertText', false, newText);
    }
    clearSelection();
  }, [clearSelection]);

  const handleInlineCancel = useCallback(() => {
    clearSelection();
    window.getSelection()?.removeAllRanges();
  }, [clearSelection]);

  // Handle image insertion from AI generation
  const handleImageInsert = useCallback((imageUrl: string, alt?: string) => {
    const imgHtml = `<img src="${imageUrl}" alt="${alt || 'AI generated image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;" />`;
    document.execCommand('insertHTML', false, imgHtml);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <SaveIndicator status={saveStatus} />

      <Breadcrumb pageId={pageId} pages={pages} />

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full text-4xl font-display font-bold text-warm-ivory bg-transparent border-none outline-none placeholder:text-warm-ivory/30 mb-6"
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

        {aiEnabled && hasSelection && selection && (
          <InlineAIToolbar
            selectedText={selection.text}
            position={selection.position}
            onApply={handleInlineApply}
            onCancel={handleInlineCancel}
          />
        )}
      </div>

      <RelatedSuggestionsPanel pageId={pageId} pageTitle={title} />

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
