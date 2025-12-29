'use client';

/**
 * Page Tags Component
 * Story: LORE-3.7 - AI Auto-Tagging
 *
 * Displays tags on a page with ability to add/remove
 */

import { useState, useEffect, useCallback } from 'react';
import { useTags, type Tag } from '@/lib/hooks/useTags';

interface PageTagsProps {
  pageId: string;
  onRequestSuggestions?: () => void;
}

export function PageTags({ pageId, onRequestSuggestions }: PageTagsProps) {
  const [pageTags, setPageTags] = useState<Tag[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const { tags, getPageTags, createTag, addTagToPage, removeTagFromPage } = useTags();

  const fetchPageTags = useCallback(async () => {
    const result = await getPageTags(pageId);
    setPageTags(result);
    setLoading(false);
  }, [pageId, getPageTags]);

  useEffect(() => {
    fetchPageTags();
  }, [fetchPageTags]);

  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim()) return;

    // Check if tag already exists in pageTags
    if (pageTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      setNewTagName('');
      setShowAddInput(false);
      return;
    }

    // Create or find existing tag
    let tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (!tag) {
      tag = await createTag(tagName);
    }

    if (tag) {
      await addTagToPage(pageId, tag.id);
      await fetchPageTags();
    }

    setNewTagName('');
    setShowAddInput(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromPage(pageId, tagId);
    setPageTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTagName);
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewTagName('');
    }
  };

  // Filter out tags already on this page for autocomplete
  const availableTags = tags.filter(
    t => !pageTags.some(pt => pt.id === t.id)
  );

  const filteredSuggestions = newTagName.trim()
    ? availableTags.filter(t =>
        t.name.toLowerCase().includes(newTagName.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 border-2 border-warm-ivory/20 border-t-warm-ivory/60 rounded-full animate-spin" />
        <span className="text-sm text-warm-ivory/40">Loading tags...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Existing tags */}
      {pageTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-full bg-tech-olive/20 text-tech-olive group"
        >
          <span>{tag.name}</span>
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {/* Add tag input */}
      {showAddInput ? (
        <div className="relative">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTagName.trim()) {
                setShowAddInput(false);
              }
            }}
            placeholder="Add tag..."
            autoFocus
            className="px-2.5 py-1 text-sm rounded-full bg-warm-ivory/10 text-warm-ivory border border-warm-ivory/20 focus:border-tech-olive focus:outline-none w-32"
          />

          {/* Autocomplete dropdown */}
          {filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-violet-deep border border-warm-ivory/10 rounded-lg shadow-lg z-10 overflow-hidden">
              {filteredSuggestions.slice(0, 5).map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleAddTag(tag.name)}
                  className="w-full px-3 py-2 text-sm text-left text-warm-ivory hover:bg-warm-ivory/10 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddInput(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full border border-dashed border-warm-ivory/20 text-warm-ivory/40 hover:border-warm-ivory/40 hover:text-warm-ivory/60 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add tag</span>
          </button>

          {onRequestSuggestions && (
            <button
              onClick={onRequestSuggestions}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full border border-dashed border-tech-olive/30 text-tech-olive/60 hover:border-tech-olive/60 hover:text-tech-olive transition-colors"
              title="Get AI tag suggestions"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Suggest</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PageTags;
