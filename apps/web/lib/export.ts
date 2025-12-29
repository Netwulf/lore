/**
 * Data Export Utilities
 * Story: LORE-3.10 - Data Export
 */

import JSZip from 'jszip';
import type { Page } from '@lore/db';

/**
 * Extract plain text from BlockNote JSON content
 */
function extractTextFromBlock(block: unknown): string {
  if (!block || typeof block !== 'object') return '';

  const b = block as Record<string, unknown>;
  const parts: string[] = [];

  // Extract text from content array
  if (Array.isArray(b.content)) {
    for (const item of b.content) {
      if (item && typeof item === 'object') {
        const i = item as Record<string, unknown>;
        if (i.type === 'text' && typeof i.text === 'string') {
          parts.push(i.text);
        }
        if (i.type === 'link' && Array.isArray(i.content)) {
          for (const linkItem of i.content) {
            if (linkItem?.type === 'text' && typeof linkItem.text === 'string') {
              parts.push(linkItem.text);
            }
          }
        }
      }
    }
  }

  // Recursively process children
  if (Array.isArray(b.children)) {
    for (const child of b.children) {
      parts.push(extractTextFromBlock(child));
    }
  }

  return parts.join('');
}

/**
 * Convert inline content to markdown
 */
function inlineToMarkdown(content: unknown[]): string {
  if (!Array.isArray(content)) return '';

  return content
    .map((item) => {
      if (!item || typeof item !== 'object') return '';

      const c = item as Record<string, unknown>;

      if (c.type === 'text') {
        let text = String(c.text || '');
        const styles = c.styles as Record<string, boolean> | undefined;
        if (styles?.bold) text = `**${text}**`;
        if (styles?.italic) text = `*${text}*`;
        if (styles?.code) text = `\`${text}\``;
        if (styles?.strikethrough) text = `~~${text}~~`;
        return text;
      }

      if (c.type === 'link') {
        const linkContent = inlineToMarkdown(c.content as unknown[]);
        return `[${linkContent}](${c.href || ''})`;
      }

      return '';
    })
    .join('');
}

/**
 * Convert BlockNote JSON to Markdown
 */
export function blocksToMarkdown(content: unknown): string {
  if (!Array.isArray(content)) return '';

  const lines: string[] = [];

  for (const block of content) {
    if (!block || typeof block !== 'object') continue;

    const b = block as Record<string, unknown>;
    const type = b.type as string;
    const props = b.props as Record<string, unknown> | undefined;
    const blockContent = b.content as unknown[];

    switch (type) {
      case 'paragraph':
        lines.push(inlineToMarkdown(blockContent));
        break;

      case 'heading': {
        const level = (props?.level as number) || 1;
        const prefix = '#'.repeat(level);
        lines.push(`${prefix} ${inlineToMarkdown(blockContent)}`);
        break;
      }

      case 'bulletListItem':
        lines.push(`- ${inlineToMarkdown(blockContent)}`);
        break;

      case 'numberedListItem':
        lines.push(`1. ${inlineToMarkdown(blockContent)}`);
        break;

      case 'checkListItem': {
        const checked = props?.checked ? 'x' : ' ';
        lines.push(`- [${checked}] ${inlineToMarkdown(blockContent)}`);
        break;
      }

      case 'codeBlock': {
        const language = (props?.language as string) || '';
        const code = extractTextFromBlock(block);
        lines.push(`\`\`\`${language}\n${code}\n\`\`\``);
        break;
      }

      case 'image': {
        const url = (props?.url as string) || '';
        const alt = (props?.caption as string) || '';
        lines.push(`![${alt}](${url})`);
        break;
      }

      case 'table': {
        const rows = b.content as unknown[];
        if (Array.isArray(rows) && rows.length > 0) {
          // Header row
          const headerRow = rows[0] as { cells: unknown[][] };
          if (headerRow?.cells) {
            lines.push(
              '| ' +
                headerRow.cells.map((cell) => inlineToMarkdown(cell)).join(' | ') +
                ' |'
            );
            lines.push('| ' + headerRow.cells.map(() => '---').join(' | ') + ' |');
          }
          // Data rows
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i] as { cells: unknown[][] };
            if (row?.cells) {
              lines.push(
                '| ' +
                  row.cells.map((cell) => inlineToMarkdown(cell)).join(' | ') +
                  ' |'
              );
            }
          }
        }
        break;
      }

      default:
        // Try to extract text from unknown block types
        const text = extractTextFromBlock(block);
        if (text) lines.push(text);
    }

    // Process nested children
    if (Array.isArray(b.children) && b.children.length > 0) {
      const childMarkdown = blocksToMarkdown(b.children);
      if (childMarkdown) {
        // Indent children
        const indented = childMarkdown
          .split('\n')
          .map((line) => (line ? `  ${line}` : ''))
          .join('\n');
        lines.push(indented);
      }
    }
  }

  return lines.filter((line) => line !== null).join('\n\n');
}

/**
 * Export a page to Markdown format with frontmatter
 */
export function pageToMarkdown(page: Page): string {
  const frontmatter = `---
title: "${page.title.replace(/"/g, '\\"')}"
id: ${page.id}
created: ${page.created_at}
updated: ${page.updated_at}
parent_id: ${page.parent_id || 'null'}
---

`;

  const content = blocksToMarkdown(page.content);
  return frontmatter + '# ' + page.title + '\n\n' + content;
}

/**
 * Export a page to JSON format
 */
export function pageToJSON(page: Page): string {
  return JSON.stringify(
    {
      id: page.id,
      title: page.title,
      content: page.content,
      parent_id: page.parent_id,
      created_at: page.created_at,
      updated_at: page.updated_at,
    },
    null,
    2
  );
}

/**
 * Build folder path from page hierarchy
 */
export function buildPagePath(
  page: Page,
  allPages: Page[],
  visited = new Set<string>()
): string {
  // Prevent infinite loops
  if (visited.has(page.id)) return '';
  visited.add(page.id);

  // Sanitize title for filename
  const sanitizedTitle = page.title
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  if (!page.parent_id) {
    return sanitizedTitle;
  }

  const parent = allPages.find((p) => p.id === page.parent_id);
  if (!parent) {
    return sanitizedTitle;
  }

  const parentPath = buildPagePath(parent, allPages, visited);
  return parentPath ? `${parentPath}/${sanitizedTitle}` : sanitizedTitle;
}

/**
 * Export all pages to a ZIP file
 */
export async function exportAllPages(
  pages: Page[],
  format: 'md' | 'json' = 'md'
): Promise<Blob> {
  const zip = new JSZip();
  const extension = format === 'md' ? 'md' : 'json';

  // Export each page
  for (const page of pages) {
    const path = buildPagePath(page, pages);
    const content =
      format === 'md' ? pageToMarkdown(page) : pageToJSON(page);

    zip.file(`pages/${path}.${extension}`, content);
  }

  // Add metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    pageCount: pages.length,
    format,
    version: '1.0',
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // Add README
  const readme = `# Lore Export

Exported on: ${new Date().toISOString()}
Pages: ${pages.length}
Format: ${format.toUpperCase()}

## Structure
- \`pages/\` - Your notes in ${format.toUpperCase()} format
- \`metadata.json\` - Export metadata

## Importing
To import this export, you can use the Lore import feature or
manually review the files.
`;
  zip.file('README.md', readme);

  // Generate ZIP
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
