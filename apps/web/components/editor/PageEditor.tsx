'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
// LORE-4.4: Use React Query version for shared cache
import { usePagesQuery } from '@/lib/hooks/usePagesQuery';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { useAIEnabled } from '@/lib/hooks/useAIEnabled';
import { usePageSave } from '@/lib/hooks/usePageSave';
import type { PartialBlock } from '@blocknote/core';
import type { WikiPage, AICommand } from '@lore/editor';
import { RelatedSuggestionsPanel } from './RelatedSuggestionsPanel';
import { InlineAIToolbar } from './InlineAIToolbar';
import { ImageGenerationModal } from './ImageGenerationModal';
import { Breadcrumb } from './Breadcrumb';
import { SaveIndicator } from './SaveIndicator';
// LORE-5.1: Import new AI modals
import { TranslateModal } from './TranslateModal';
import { BrainstormModal } from './BrainstormModal';
import { AskAIModal } from './AskAIModal';

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
  // LORE-5.1: State for new AI modals
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [showBrainstormModal, setShowBrainstormModal] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedTextForAI, setSelectedTextForAI] = useState('');
  const [pageContentForAI, setPageContentForAI] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // LORE-4.1: Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  const { pages, createPage } = usePagesQuery();
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

  // LORE-4.3: Memoize wikiPages to prevent new array on every render
  const wikiPages = useMemo<WikiPage[]>(() =>
    pages.map((p) => ({
      id: p.id,
      title: p.title,
      parent_id: p.parent_id,
    }))
  , [pages]);

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

  // LORE-5.1: Handle AI commands from slash menu
  const handleAICommand = useCallback(async (
    command: AICommand,
    context: { selection?: string; pageContent?: string }
  ) => {
    const { selection, pageContent } = context;

    // Store context for modals
    setSelectedTextForAI(selection || '');
    setPageContentForAI(pageContent || '');

    switch (command.id) {
      case 'ask':
        setShowAskModal(true);
        break;

      case 'continue':
        // Stream continuation directly into editor
        if (!pageContent || pageContent.length < 10) {
          alert('Need more content to continue writing');
          return;
        }
        setIsContinuing(true);
        try {
          const response = await fetch('/api/ai/continue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: pageContent, pageTitle: title }),
          });

          if (!response.ok) throw new Error('Failed to continue');

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content') {
                      document.execCommand('insertText', false, parsed.text);
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Continue error:', err);
        } finally {
          setIsContinuing(false);
        }
        break;

      case 'summarize':
      case 'expand':
      case 'rewrite':
        // Use existing inline API
        if (command.requiresSelection && !selection) {
          alert(`Please select text to ${command.id}`);
          return;
        }
        try {
          const textToProcess = selection || pageContent?.slice(0, 2000) || '';
          const response = await fetch('/api/ai/inline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: command.id, text: textToProcess }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error);

          // Insert result
          if (selection) {
            document.execCommand('insertText', false, data.result);
          } else {
            document.execCommand('insertText', false, '\n\n' + data.result);
          }
        } catch (err) {
          console.error(`${command.id} error:`, err);
          alert(`Failed to ${command.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        break;

      case 'translate':
        if (!selection) {
          alert('Please select text to translate');
          return;
        }
        setShowTranslateModal(true);
        break;

      case 'brainstorm':
        setShowBrainstormModal(true);
        break;

      default:
        console.log('Unknown command:', command.id);
    }
  }, [title]);

  // LORE-5.1: Handle text insertion from AI modals
  const handleAIInsert = useCallback((text: string) => {
    document.execCommand('insertText', false, text);
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
          onAICommand={aiEnabled ? handleAICommand : undefined}
        />

        {/* LORE-5.1: Continue writing indicator */}
        {isContinuing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-tech-olive/20 border border-tech-olive/40 rounded text-sm text-tech-olive">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI is writing...
          </div>
        )}

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

      {/* LORE-5.1: New AI modals */}
      {showTranslateModal && (
        <TranslateModal
          text={selectedTextForAI}
          onInsert={handleAIInsert}
          onClose={() => setShowTranslateModal(false)}
        />
      )}

      {showBrainstormModal && (
        <BrainstormModal
          context={pageContentForAI}
          pageTitle={title}
          onInsert={handleAIInsert}
          onClose={() => setShowBrainstormModal(false)}
        />
      )}

      {showAskModal && (
        <AskAIModal
          context={pageContentForAI}
          pageTitle={title}
          onInsert={handleAIInsert}
          onClose={() => setShowAskModal(false)}
        />
      )}
    </div>
  );
}

export default PageEditor;
