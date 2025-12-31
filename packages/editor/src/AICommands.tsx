/**
 * AI Slash Commands for Lore Editor
 * Story: LORE-5.1 - Expand AI Slash Commands
 */

export interface AICommand {
  id: string;
  title: string;
  description: string;
  icon: string;
  aliases: string[];
  requiresSelection: boolean;
  action: 'inline' | 'modal' | 'stream' | 'image';
}

export const AI_COMMANDS: AICommand[] = [
  {
    id: 'ask',
    title: 'Ask AI',
    description: 'Ask a question and get an answer',
    icon: '💬',
    aliases: ['ask', 'question', 'q', 'help'],
    requiresSelection: false,
    action: 'modal',
  },
  {
    id: 'continue',
    title: 'Continue writing',
    description: 'AI continues from where you left off',
    icon: '➡️',
    aliases: ['continue', 'cont', 'more', 'write'],
    requiresSelection: false,
    action: 'stream',
  },
  {
    id: 'summarize',
    title: 'Summarize',
    description: 'Create a summary of the text',
    icon: '📝',
    aliases: ['summarize', 'summary', 'tldr', 'brief'],
    requiresSelection: false,
    action: 'inline',
  },
  {
    id: 'expand',
    title: 'Expand',
    description: 'Expand the selected text with more detail',
    icon: '↔️',
    aliases: ['expand', 'elaborate', 'detail', 'more'],
    requiresSelection: true,
    action: 'inline',
  },
  {
    id: 'rewrite',
    title: 'Rewrite',
    description: 'Rewrite the selected text',
    icon: '✏️',
    aliases: ['rewrite', 'rephrase', 'improve', 'fix'],
    requiresSelection: true,
    action: 'inline',
  },
  {
    id: 'translate',
    title: 'Translate',
    description: 'Translate to another language',
    icon: '🌐',
    aliases: ['translate', 'trans', 'lang', 'language'],
    requiresSelection: true,
    action: 'modal',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm',
    description: 'Generate ideas about a topic',
    icon: '💡',
    aliases: ['brainstorm', 'ideas', 'think', 'generate'],
    requiresSelection: false,
    action: 'modal',
  },
  {
    id: 'image',
    title: 'Generate Image',
    description: 'Create an AI-generated image',
    icon: '🖼️',
    aliases: ['image', 'img', 'picture', 'dalle', 'ai'],
    requiresSelection: false,
    action: 'image',
  },
];

/**
 * Filter commands by query string
 */
export function filterAICommands(query: string): AICommand[] {
  const lowerQuery = query.toLowerCase();

  return AI_COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.id.toLowerCase().includes(lowerQuery) ||
      cmd.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get a specific command by ID
 */
export function getAICommand(id: string): AICommand | undefined {
  return AI_COMMANDS.find((cmd) => cmd.id === id);
}
