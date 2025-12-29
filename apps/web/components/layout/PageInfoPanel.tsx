'use client';

/**
 * Page Info Panel for Sidebar
 * Stories: E1-S3, E1-S5 - Move tags and backlinks to sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTags, type Tag } from '@/lib/hooks/useTags';

interface Backlink {
  pageId: string;
  pageTitle: string;
}

export function PageInfoPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Extract pageId from pathname (e.g., /page/123 -> 123)
  const pageId = pathname?.startsWith('/page/') ? pathname.split('/')[2] : null;

  const [pageTags, setPageTags] = useState<Tag[]>([]);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingBacklinks, setLoadingBacklinks] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [backlinksExpanded, setBacklinksExpanded] = useState(false);

  const { tags, getPageTags, createTag, addTagToPage, removeTagFromPage } = useTags();

  // Fetch page tags
  const fetchPageTags = useCallback(async () => {
    if (!pageId) return;
    setLoadingTags(true);
    const result = await getPageTags(pageId);
    setPageTags(result);
    setLoadingTags(false);
  }, [pageId, getPageTags]);

  // Fetch backlinks
  const fetchBacklinks = useCallback(async () => {
    if (!pageId) return;
    setLoadingBacklinks(true);
    try {
      const { data, error } = await supabase
        .from('page_links')
        .select(`
          source_id,
          pages!page_links_source_id_fkey (
            id,
            title
          )
        `)
        .eq('target_id', pageId);

      if (!error && data) {
        const links: Backlink[] = data.map((link: any) => ({
          pageId: link.pages.id,
          pageTitle: link.pages.title,
        }));
        setBacklinks(links);
      }
    } catch (err) {
      console.error('Error fetching backlinks:', err);
    } finally {
      setLoadingBacklinks(false);
    }
  }, [pageId, supabase]);

  useEffect(() => {
    if (pageId) {
      fetchPageTags();
      fetchBacklinks();
    }
  }, [pageId, fetchPageTags, fetchBacklinks]);

  // Tag handlers
  const handleAddTag = async (tagName: string) => {
    if (!tagName.trim() || !pageId) return;

    if (pageTags.some(t => t.name.toLowerCase() === tagName.toLowerCase())) {
      setNewTagName('');
      setShowAddInput(false);
      return;
    }

    let tag: Tag | null | undefined = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
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
    if (!pageId) return;
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

  // Don't render if no page is selected
  if (!pageId) {
    return null;
  }

  const availableTags = tags.filter(t => !pageTags.some(pt => pt.id === t.id));
  const filteredSuggestions = newTagName.trim()
    ? availableTags.filter(t => t.name.toLowerCase().includes(newTagName.toLowerCase()))
    : [];

  return (
    <div className="py-2 border-t border-warm-ivory/10">
      {/* Section Header */}
      <div className="px-3 py-2 text-xs font-medium text-warm-ivory/40 uppercase tracking-wider">
        Page Info
      </div>

      {/* Tags Section */}
      <div className="px-3 py-1">
        <button
          onClick={() => setTagsExpanded(!tagsExpanded)}
          className="w-full flex items-center justify-between py-1 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
        >
          <span className="flex items-center gap-2">
            <TagIcon className="w-3.5 h-3.5" />
            Tags
          </span>
          <span className="text-xs text-warm-ivory/40">
            {loadingTags ? '...' : pageTags.length}
          </span>
        </button>

        {tagsExpanded && (
          <div className="mt-1 flex flex-wrap gap-1">
            {loadingTags ? (
              <span className="text-xs text-warm-ivory/40">Loading...</span>
            ) : (
              <>
                {pageTags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-tech-olive/20 text-tech-olive group"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}

                {showAddInput ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={() => !newTagName.trim() && setShowAddInput(false)}
                      placeholder="tag..."
                      autoFocus
                      className="px-2 py-0.5 text-xs rounded-full bg-warm-ivory/10 text-warm-ivory border border-warm-ivory/20 focus:border-tech-olive focus:outline-none w-20"
                    />
                    {filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-32 bg-violet-deep border border-warm-ivory/10 rounded shadow-lg z-10 overflow-hidden">
                        {filteredSuggestions.slice(0, 4).map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTag(tag.name)}
                            className="w-full px-2 py-1 text-xs text-left text-warm-ivory hover:bg-warm-ivory/10"
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddInput(true)}
                    className="px-2 py-0.5 text-xs rounded-full border border-dashed border-warm-ivory/20 text-warm-ivory/40 hover:border-warm-ivory/40 hover:text-warm-ivory/60 transition-colors"
                  >
                    +
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Backlinks Section */}
      <div className="px-3 py-1 mt-1">
        <button
          onClick={() => setBacklinksExpanded(!backlinksExpanded)}
          className="w-full flex items-center justify-between py-1 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
        >
          <span className="flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" />
            Backlinks
          </span>
          <span className="text-xs text-warm-ivory/40">
            {loadingBacklinks ? '...' : backlinks.length}
          </span>
        </button>

        {backlinksExpanded && (
          <div className="mt-1 space-y-0.5">
            {loadingBacklinks ? (
              <span className="text-xs text-warm-ivory/40">Loading...</span>
            ) : backlinks.length === 0 ? (
              <span className="text-xs text-warm-ivory/40">No backlinks</span>
            ) : (
              backlinks.map(link => (
                <button
                  key={link.pageId}
                  onClick={() => router.push(`/page/${link.pageId}`)}
                  className="w-full text-left px-2 py-1 text-xs text-warm-ivory/70 hover:text-warm-ivory hover:bg-warm-ivory/5 rounded transition-colors truncate"
                >
                  {link.pageTitle}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export default PageInfoPanel;
