/**
 * Embeddings Utilities
 * Story: LORE-3.1 - Embeddings Infrastructure
 */

import type { LLMProvider, EmbeddingOptions } from './types';

/**
 * Token estimation (rough approximation: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunk text into smaller pieces for embedding
 * Tries to break at sentence boundaries when possible
 */
export function chunkText(
  text: string,
  maxTokens: number = 1000,
  overlap: number = 100
): string[] {
  const maxChars = maxTokens * 4; // ~4 chars per token
  const overlapChars = overlap * 4;

  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    if (end >= text.length) {
      // Last chunk
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to find a sentence boundary near the end
    const searchStart = Math.max(start + maxChars - 200, start);
    const segment = text.slice(searchStart, end);

    // Look for sentence endings
    const sentenceEnds = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestBreak = -1;

    for (const ending of sentenceEnds) {
      const idx = segment.lastIndexOf(ending);
      if (idx !== -1) {
        const absoluteIdx = searchStart + idx + ending.length;
        if (bestBreak === -1 || absoluteIdx > bestBreak) {
          bestBreak = absoluteIdx;
        }
      }
    }

    // If no sentence break found, try paragraph break
    if (bestBreak === -1) {
      const paragraphBreak = segment.lastIndexOf('\n\n');
      if (paragraphBreak !== -1) {
        bestBreak = searchStart + paragraphBreak + 2;
      }
    }

    // If still no break, just use max length
    if (bestBreak === -1 || bestBreak <= start) {
      bestBreak = end;
    }

    chunks.push(text.slice(start, bestBreak).trim());
    start = bestBreak - overlapChars; // Overlap for context continuity
    if (start < 0) start = bestBreak;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Extract plain text from BlockNote JSON content
 */
export function extractTextFromBlockNote(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const blocks = Array.isArray(content) ? content : [];
  const textParts: string[] = [];

  function extractFromBlock(block: unknown): void {
    if (!block || typeof block !== 'object') return;

    const b = block as Record<string, unknown>;

    // Extract text from content array
    if (Array.isArray(b.content)) {
      for (const item of b.content) {
        if (item && typeof item === 'object') {
          const i = item as Record<string, unknown>;
          if (i.type === 'text' && typeof i.text === 'string') {
            textParts.push(i.text);
          }
        }
      }
    }

    // Recursively process children
    if (Array.isArray(b.children)) {
      for (const child of b.children) {
        extractFromBlock(child);
      }
    }
  }

  for (const block of blocks) {
    extractFromBlock(block);
  }

  return textParts.join(' ').trim();
}

/**
 * Generate embeddings for text, chunking if necessary
 */
export interface ChunkEmbedding {
  chunkIndex: number;
  content: string;
  embedding: number[];
}

export async function generateEmbeddings(
  provider: LLMProvider,
  text: string,
  options?: EmbeddingOptions & { maxTokens?: number }
): Promise<ChunkEmbedding[]> {
  const maxTokens = options?.maxTokens || 1000;
  const chunks = chunkText(text, maxTokens);

  const results: ChunkEmbedding[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await provider.embed(chunk, options);

    results.push({
      chunkIndex: i,
      content: chunk,
      embedding,
    });
  }

  return results;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
