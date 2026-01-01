'use client';

import { useEffect, useMemo } from 'react';
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  PartialBlock,
} from '@blocknote/core';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import {
  useCreateBlockNote,
  DefaultReactSuggestionItem,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

import { WikiLink } from './WikiLink';
import { AI_COMMANDS, type AICommand } from './AICommands';

// Page type for wiki links
export interface WikiPage {
  id: string;
  title: string;
  parent_id?: string | null;
}

// AI Command handler callback type
export interface AICommandHandler {
  onImage?: () => void;
  onAsk?: (context: string) => void;
  onContinue?: (context: string) => void;
  onSummarize?: (text: string) => void;
  onExpand?: (text: string) => void;
  onRewrite?: (text: string) => void;
  onTranslate?: (text: string) => void;
  onBrainstorm?: (context: string) => void;
}

export interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  editable?: boolean;
  pages?: WikiPage[];
  onCreatePage?: (title: string) => Promise<WikiPage | null>;
  onImageCommand?: () => void; // Triggers when /image is typed
  onAICommand?: (command: AICommand, context: { selection?: string; pageContent?: string }) => void;
}

// Schema with WikiLink inline content
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikiLink: WikiLink,
  },
});

// Type for our custom editor
type WikiEditor = typeof schema.BlockNoteEditor;

/**
 * Get wiki link menu items based on available pages
 */
function getWikiLinkMenuItems(
  editor: WikiEditor,
  pages: WikiPage[],
  query: string,
  onCreatePage?: (title: string) => Promise<WikiPage | null>
): DefaultReactSuggestionItem[] {
  // Filter pages by query
  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(query.toLowerCase())
  );

  // Create menu items for existing pages
  const pageItems: DefaultReactSuggestionItem[] = filteredPages.map((page) => ({
    title: page.title,
    onItemClick: () => {
      editor.insertInlineContent([
        {
          type: 'wikiLink',
          props: {
            pageId: page.id,
            pageTitle: page.title,
          },
        },
        ' ',
      ]);
    },
  }));

  // Add "Create new page" option if query doesn't match exactly
  const exactMatch = pages.some(
    (p) => p.title.toLowerCase() === query.toLowerCase()
  );

  if (query.trim() && !exactMatch && onCreatePage) {
    pageItems.push({
      title: `Create "${query}"`,
      onItemClick: async () => {
        const newPage = await onCreatePage(query.trim());
        if (newPage) {
          editor.insertInlineContent([
            {
              type: 'wikiLink',
              props: {
                pageId: newPage.id,
                pageTitle: newPage.title,
              },
            },
            ' ',
          ]);
        }
      },
    });
  }

  return pageItems;
}

/**
 * Get all slash menu items: BlockNote defaults + AI commands
 * E6-S1: Restored default BlockNote commands, AI commands in separate group
 */
function getSlashMenuItems(
  editor: WikiEditor,
  onImageCommand?: () => void,
  onAICommand?: (command: AICommand, context: { selection?: string; pageContent?: string }) => void
): DefaultReactSuggestionItem[] {
  // 1. Get default BlockNote slash menu items (always available)
  const defaultItems = getDefaultReactSlashMenuItems(editor as any);

  // 2. Get AI command items (only if handlers provided)
  const aiItems: DefaultReactSuggestionItem[] = [];

  if (onImageCommand || onAICommand) {
    // Get current selection if any
    const getSelection = (): string => {
      try {
        const selection = editor.getSelectedText();
        return selection || '';
      } catch {
        return '';
      }
    };

    // Get full page content as context
    const getPageContent = (): string => {
      try {
        const blocks = editor.document;
        return blocks
          .map((block: any) => {
            if (block.content) {
              return block.content
                .map((c: any) => c.text || '')
                .filter(Boolean)
                .join('');
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      } catch {
        return '';
      }
    };

    // Convert AI commands to menu items with "AI" group
    AI_COMMANDS.forEach((cmd) => {
      aiItems.push({
        title: `${cmd.icon} ${cmd.title}`,
        subtext: cmd.description,
        aliases: cmd.aliases,
        group: 'AI', // Separate group for visual distinction
        onItemClick: () => {
          const selection = getSelection();
          const pageContent = getPageContent();

          // Handle image command specially for backward compatibility
          if (cmd.id === 'image' && onImageCommand) {
            onImageCommand();
            return;
          }

          // Call the general AI command handler
          if (onAICommand) {
            onAICommand(cmd, { selection, pageContent });
          }
        },
      });
    });
  }

  // 3. Combine: defaults first, then AI commands
  return [...defaultItems, ...aiItems];
}

export function Editor({
  initialContent,
  onChange,
  editable = true,
  pages = [],
  onCreatePage,
  onImageCommand,
  onAICommand,
}: EditorProps) {
  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent?.length
      ? (initialContent as typeof schema.PartialBlock[])
      : undefined,
  });

  // Handle content changes
  useEffect(() => {
    if (!onChange) return;

    const handleChange = () => {
      const content = editor.document;
      onChange(content as PartialBlock[]);
    };

    editor.onEditorContentChange(handleChange);
  }, [editor, onChange]);

  return (
    <div className="lore-editor">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="dark"
        slashMenu={false}
        data-theming-css-variables-demo
      >
        {/* Wiki Link suggestion menu - triggers on [ */}
        <SuggestionMenuController
          triggerCharacter="["
          getItems={async (query) => {
            // Remove leading [ if present (for [[ trigger)
            const cleanQuery = query.startsWith('[') ? query.slice(1) : query;
            return filterSuggestionItems(
              getWikiLinkMenuItems(editor, pages, cleanQuery, onCreatePage),
              cleanQuery
            );
          }}
        />

        {/* Slash menu - BlockNote defaults + AI commands
            E6-S1: Always show menu, works with or without AI enabled */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              getSlashMenuItems(editor, onImageCommand, onAICommand),
              query
            )
          }
        />
      </BlockNoteView>
      <style jsx global>{`
        .lore-editor {
          --bn-colors-editor-background: #0a0a0a;
          --bn-colors-editor-text: #f5f2eb;
          --bn-colors-menu-background: #1a1025;
          --bn-colors-menu-text: #f5f2eb;
          --bn-colors-tooltip-background: #261833;
          --bn-colors-tooltip-text: #f5f2eb;
          --bn-colors-hovered-background: rgba(141, 199, 94, 0.1);
          --bn-colors-selected-background: rgba(141, 199, 94, 0.2);
          --bn-colors-side-menu: rgba(245, 242, 235, 0.4);
          --bn-colors-highlights-gray-background: rgba(245, 242, 235, 0.1);
          --bn-colors-highlights-gray-text: #f5f2eb;
          --bn-font-family: var(--font-inter), Inter, system-ui, sans-serif;
          --bn-border-radius: 0;
        }

        .lore-editor .bn-container {
          background: transparent;
        }

        .lore-editor .bn-editor {
          padding: 0;
        }

        .lore-editor .bn-block-content {
          font-size: 1rem;
          line-height: 1.6;
        }

        .lore-editor [data-content-type='heading'][data-level='1'] {
          font-family: var(--font-space-grotesk), Space Grotesk, sans-serif;
          font-size: 2.25rem;
          font-weight: 600;
        }

        .lore-editor [data-content-type='heading'][data-level='2'] {
          font-family: var(--font-space-grotesk), Space Grotesk, sans-serif;
          font-size: 1.875rem;
          font-weight: 600;
        }

        .lore-editor [data-content-type='heading'][data-level='3'] {
          font-family: var(--font-space-grotesk), Space Grotesk, sans-serif;
          font-size: 1.5rem;
          font-weight: 500;
        }

        .lore-editor [data-content-type='codeBlock'] {
          font-family: var(--font-ibm-plex-mono), IBM Plex Mono, monospace;
          background: #1a1025;
        }

        /* Wiki link styles */
        .lore-editor .wiki-link {
          color: #8dc75e !important;
          text-decoration: none !important;
        }

        .lore-editor .wiki-link:hover {
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
}

export default Editor;
