/**
 * AI Onboarding Modal
 * Story: LORE-5.4 - AI Onboarding & Discovery
 *
 * Shows AI features to new users and guides them to setup
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AIOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_FEATURES = [
  {
    icon: '💬',
    title: 'Chat Sidebar',
    description: 'Ask questions about your notes with AI-powered search',
    shortcut: 'Click AI in header',
  },
  {
    icon: '⌘J',
    title: 'Quick AI',
    description: 'Get instant AI help anywhere with a keyboard shortcut',
    shortcut: '⌘J / Ctrl+J',
  },
  {
    icon: '/',
    title: 'Slash Commands',
    description: 'Type / in the editor for AI actions',
    shortcut: '/continue, /summarize, /expand...',
  },
  {
    icon: '✏️',
    title: 'Inline Actions',
    description: 'Select text to expand, rewrite, or summarize',
    shortcut: 'Select text → AI toolbar',
  },
];

export function AIOnboardingModal({ isOpen, onClose }: AIOnboardingModalProps) {
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#1a1025] border border-warm-ivory/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b border-warm-ivory/10">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-2xl font-display font-bold text-warm-ivory">
            AI Features Available
          </h2>
          <p className="mt-2 text-warm-ivory/60 text-sm">
            Lore has powerful AI capabilities to help you write and explore your notes
          </p>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4">
          {AI_FEATURES.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-warm-ivory/5 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-tech-olive/20 text-tech-olive text-lg">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-warm-ivory">{feature.title}</h3>
                <p className="text-sm text-warm-ivory/60 mt-0.5">
                  {feature.description}
                </p>
                <p className="text-xs text-tech-olive mt-1">{feature.shortcut}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="border-t border-warm-ivory/10" />
        </div>

        {/* Setup Section */}
        <div className="p-6 text-center">
          <p className="text-sm text-warm-ivory/60 mb-4">
            To use AI features, configure your API key in Settings
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                router.push('/settings');
                onClose();
              }}
              className="px-4 py-2 text-sm bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors"
            >
              Set Up AI Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIOnboardingModal;
