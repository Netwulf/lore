'use client';

import { useEffect, useState, useCallback } from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

const shortcuts: ShortcutCategory[] = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Command palette' },
      { keys: ['⌘', 'N'], description: 'New page' },
      { keys: ['⌘', '/'], description: 'Keyboard shortcuts' },
      { keys: ['⌘', 'G'], description: 'Graph view' },
    ],
  },
  {
    category: 'Editor',
    items: [
      { keys: ['⌘', 'B'], description: 'Bold' },
      { keys: ['⌘', 'I'], description: 'Italic' },
      { keys: ['⌘', 'U'], description: 'Underline' },
      { keys: ['[['], description: 'Link to page' },
      { keys: ['/'], description: 'Slash commands' },
    ],
  },
  {
    category: 'AI Features',
    items: [
      { keys: ['Select', '+', 'wait'], description: 'AI inline actions' },
      { keys: ['/image'], description: 'Generate image' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function KeyboardShortcutsModalContent({ onClose }: { onClose: () => void }) {
  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-twilight-deep border border-warm-ivory/10 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-ivory/10">
          <h2 className="text-lg font-display font-semibold text-warm-ivory">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-warm-ivory/10 rounded transition-colors"
            title="Close (Esc)"
          >
            <svg
              className="w-5 h-5 text-warm-ivory/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-warm-ivory/40 uppercase tracking-wider mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-warm-ivory/70">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs bg-warm-ivory/5 border border-warm-ivory/10 rounded text-warm-ivory/60 min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-warm-ivory/10 text-xs text-warm-ivory/30 text-center">
          Use ⌘ on Mac or Ctrl on Windows/Linux
        </div>
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;
  return <KeyboardShortcutsModalContent onClose={onClose} />;
}

/**
 * Hook to manage keyboard shortcuts modal state
 * Listens for ⌘/ to open the modal
 */
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global listener for ⌘/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, open, close };
}
