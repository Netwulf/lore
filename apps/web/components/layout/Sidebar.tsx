'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageTree from './PageTree';
import { TagsSidebar } from './TagsSidebar';
import { PageInfoPanel } from './PageInfoPanel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage?: () => Promise<{ id: string } | null>;
}

export default function Sidebar({ isOpen, onClose, onCreatePage }: SidebarProps) {
  const router = useRouter();

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreatePage = async () => {
    if (!onCreatePage) return;
    const newPage = await onCreatePage();
    if (newPage) {
      router.push(`/page/${newPage.id}`);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-sidebar bg-void-black border-r border-warm-ivory/10
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-warm-ivory/10">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-warm-ivory">
              Lore
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {/* New Page Button */}
            <button
              onClick={handleCreatePage}
              className="p-1.5 hover:bg-warm-ivory/10 rounded transition-colors"
              title="New page (⌘N)"
            >
              <svg className="w-4 h-4 text-warm-ivory/60 hover:text-warm-ivory" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Close Button (mobile) */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-warm-ivory/60 hover:text-warm-ivory"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation with Page Tree, Page Info, and Tags */}
        <nav className="flex-1 overflow-y-auto p-2 flex flex-col">
          <PageTree />

          {/* Page Info Section (Tags & Backlinks) */}
          <PageInfoPanel />

          {/* Separator */}
          <div className="border-t border-warm-ivory/10 my-2" />

          {/* All Tags Section */}
          <TagsSidebar />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-warm-ivory/10 space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory hover:bg-warm-ivory/5 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
          <p className="text-xs text-warm-ivory/30 text-center">
            Press <kbd className="px-1 py-0.5 bg-warm-ivory/5 rounded">⌘/</kbd> for shortcuts
          </p>
        </div>
      </aside>
    </>
  );
}
