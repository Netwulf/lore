'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string }[];
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageId?: string;
}

export function ChatSidebar({ isOpen, onClose, currentPageId }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<{ id: string; title: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingSources([]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          currentPageId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let sources: { id: string; title: string }[] = [];

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

              if (parsed.type === 'sources') {
                sources = parsed.pages;
                setStreamingSources(sources);
              } else if (parsed.type === 'content') {
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add complete message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
      setStreamingSources([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        },
      ]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentPageId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Parse citations in text
  const renderContent = (content: string) => {
    const parts = content.split(/(\[[^\]]+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[([^\]]+)\]$/);
      if (match) {
        const title = match[1];
        return (
          <span
            key={i}
            className="text-tech-olive hover:underline cursor-pointer font-medium"
            title={`Referenced: ${title}`}
          >
            [{title}]
          </span>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-void-black border-l border-warm-ivory/10 flex flex-col z-40 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-warm-ivory/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-tech-olive"
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
          <span className="font-display font-semibold text-warm-ivory">
            AI Chat
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-warm-ivory/10 rounded transition-colors"
          title="Close"
        >
          <svg
            className="w-5 h-5 text-warm-ivory/60 hover:text-warm-ivory"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-warm-ivory/40 text-sm py-8">
            <p className="mb-2">Ask me anything about your notes!</p>
            <p className="text-xs">
              I can search your knowledge base and answer questions.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-tech-olive text-void-black'
                  : 'bg-warm-ivory/10 text-warm-ivory'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {renderContent(message.content)}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-warm-ivory/10">
                  <p className="text-xs text-warm-ivory/50 mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.sources.map((source) => (
                      <Link
                        key={source.id}
                        href={`/page/${source.id}`}
                        className="text-xs text-tech-olive hover:underline"
                      >
                        {source.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {(streamingContent || isLoading) && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 bg-warm-ivory/10 text-warm-ivory">
              {streamingContent ? (
                <>
                  <div className="text-sm whitespace-pre-wrap">
                    {renderContent(streamingContent)}
                  </div>
                  {streamingSources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-warm-ivory/10">
                      <p className="text-xs text-warm-ivory/50 mb-1">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {streamingSources.map((source) => (
                          <span
                            key={source.id}
                            className="text-xs text-tech-olive"
                          >
                            {source.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex gap-1">
                    <span className="w-2 h-2 bg-tech-olive rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-tech-olive rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-tech-olive rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-warm-ivory/40">Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-warm-ivory/10 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 px-3 py-2 bg-warm-ivory/5 border border-warm-ivory/10 rounded text-warm-ivory text-sm placeholder:text-warm-ivory/30 focus:outline-none focus:border-tech-olive/50 resize-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-tech-olive text-void-black font-medium rounded hover:bg-tech-olive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-warm-ivory/30 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default ChatSidebar;
