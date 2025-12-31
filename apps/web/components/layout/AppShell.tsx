'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from './KeyboardShortcutsModal';
import LogoutButton from '@/components/LogoutButton';
// LORE-4.4: Use React Query version for shared cache
import { usePagesQuery } from '@/lib/hooks/usePagesQuery';
import { useAIEnabled } from '@/lib/hooks/useAIEnabled';
// LORE-5.3: Quick AI Modal
import { QuickAIModal } from '@/components/ai/QuickAIModal';

// Lazy load heavy components
const GraphViewModal = dynamic(
  () => import('@/components/graph/GraphViewModal'),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 bg-void-black flex items-center justify-center">
        <div className="text-warm-ivory/40">Loading graph...</div>
      </div>
    ),
    ssr: false,
  }
);

const ChatSidebar = dynamic(
  () => import('@/components/chat/ChatSidebar'),
  {
    loading: () => (
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-void-black border-l border-warm-ivory/10 flex items-center justify-center z-40">
        <div className="text-warm-ivory/40">Loading chat...</div>
      </div>
    ),
    ssr: false,
  }
);

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

export default function AppShell({ children, userEmail }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  // LORE-5.3: Quick AI Modal state
  const [quickAIOpen, setQuickAIOpen] = useState(false);
  const { pages, createPage } = usePagesQuery();
  const { enabled: aiEnabled } = useAIEnabled();
  const router = useRouter();
  const { isOpen: shortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsModal();

  // Handle create page and navigate
  const handleCreatePage = useCallback(async () => {
    const newPage = await createPage();
    if (newPage) {
      router.push(`/page/${newPage.id}`);
    }
    return newPage;
  }, [createPage, router]);

  // Keyboard shortcuts: ⌘N for new page, ⌘J for Quick AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘N - New page
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleCreatePage();
      }
      // LORE-5.3: ⌘J - Quick AI
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && aiEnabled) {
        e.preventDefault();
        setQuickAIOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCreatePage, aiEnabled]);

  // LORE-5.3: Handle Quick AI insert
  const handleQuickAIInsert = useCallback((text: string) => {
    // Insert at current cursor position using execCommand
    document.execCommand('insertText', false, text);
  }, []);

  const handleQuickAIReplace = useCallback((text: string) => {
    // Replace selection with new text
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className="flex h-screen bg-void-black overflow-hidden">
      {/* Command Palette (⌘K) */}
      <CommandPalette pages={pages} />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreatePage={handleCreatePage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-warm-ivory/10 bg-void-black">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-warm-ivory/60 hover:text-warm-ivory"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop spacer */}
          <div className="hidden md:block" />

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* AI Chat Button - Only show if AI is enabled */}
            {aiEnabled && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                  chatOpen
                    ? 'bg-tech-olive text-void-black'
                    : 'text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5'
                }`}
                title="AI Chat"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span className="hidden sm:inline">AI</span>
              </button>
            )}
            {/* Graph View Button */}
            <button
              onClick={() => setGraphOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5 rounded transition-colors"
              title="Graph View"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="hidden sm:inline">Graph</span>
            </button>
            {/* Settings Button */}
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5 rounded transition-colors"
              title="Settings"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Link>
            {userEmail && (
              <span className="hidden sm:block text-warm-ivory/60 text-sm">
                {userEmail}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Graph View Modal */}
      <GraphViewModal isOpen={graphOpen} onClose={() => setGraphOpen(false)} />

      {/* AI Chat Sidebar - Only render if AI is enabled */}
      {aiEnabled && (
        <ChatSidebar isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={closeShortcuts} />

      {/* LORE-5.3: Quick AI Modal (⌘J) */}
      {aiEnabled && (
        <QuickAIModal
          isOpen={quickAIOpen}
          onClose={() => setQuickAIOpen(false)}
          onInsert={handleQuickAIInsert}
          onReplace={handleQuickAIReplace}
        />
      )}
    </div>
  );
}
