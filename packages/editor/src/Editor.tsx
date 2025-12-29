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
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

import { WikiLink } from './WikiLink';

// Page type for wiki links
export interface WikiPage {
  id: string;
  title: string;
  parent_id?: string | null;
}

export interface EditorProps {
  initialContent?: PartialBlock[];
  onChange?: (content: PartialBlock[]) => void;
  editable?: boolean;
  pages?: WikiPage[];
  onCreatePage?: (title: string) => Promise<WikiPage | null>;
  onImageCommand?: () => void; // Triggers when /image is typed
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
 * Get AI command menu items (triggered by /)
 */
function getAICommandMenuItems(
  editor: WikiEditor,
  query: string,
  onImageCommand?: () => void
): DefaultReactSuggestionItem[] {
  const items: DefaultReactSuggestionItem[] = [];

  // Image generation command
  if (onImageCommand) {
    items.push({
      title: 'Generate Image',
      subtext: 'Create an AI-generated image',
      onItemClick: () => {
        onImageCommand();
      },
      aliases: ['image', 'ai-image', 'dalle', 'picture'],
    });
  }

  // Filter items based on query
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.aliases?.some((alias) =>
        alias.toLowerCase().includes(query.toLowerCase())
      )
  );
}

export function Editor({
  initialContent,
  onChange,
  editable = true,
  pages = [],
  onCreatePage,
  onImageCommand,
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

        {/* AI Commands menu - triggers on /ai */}
        {onImageCommand && (
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => {
              // Only show AI commands when query starts with 'ai' or matches image-related terms
              if (query.toLowerCase().startsWith('ai') ||
                  query.toLowerCase().startsWith('image') ||
                  query.toLowerCase().startsWith('img') ||
                  query.toLowerCase().startsWith('gen')) {
                return getAICommandMenuItems(editor, query, onImageCommand);
              }
              return [];
            }}
          />
        )}
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
