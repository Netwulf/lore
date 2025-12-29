'use client';

/**
 * Image Generation Modal
 * Story: LORE-3.8 - Image Generation
 *
 * Modal for generating images via AI with prompt input and preview
 */

import { useState } from 'react';

interface ImageGenerationModalProps {
  onInsert: (imageUrl: string, alt?: string) => void;
  onClose: () => void;
}

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';

export function ImageGenerationModal({ onInsert, onClose }: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    revisedPrompt?: string;
    temporary?: boolean;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setPreview({
        url: data.url,
        revisedPrompt: data.revisedPrompt,
        temporary: data.temporary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (preview) {
      onInsert(preview.url, prompt);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey && prompt.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80">
      <div className="bg-violet-deep border border-warm-ivory/10 rounded-lg shadow-2xl max-w-2xl w-full mx-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-warm-ivory/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-tech-olive" />
            <h3 className="text-lg font-medium text-warm-ivory">Generate Image</h3>
          </div>
          <button
            onClick={onClose}
            className="text-warm-ivory/40 hover:text-warm-ivory transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-warm-ivory/60 mb-2">
              Describe the image you want
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="A serene mountain landscape at sunset with a reflective lake..."
              rows={3}
              className="w-full px-4 py-3 bg-warm-ivory/5 border border-warm-ivory/10 rounded-lg text-warm-ivory placeholder:text-warm-ivory/30 focus:border-tech-olive focus:outline-none resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-warm-ivory/40">
              Press ⌘+Enter to generate
            </p>
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-sm font-medium text-warm-ivory/60 mb-2">
              Image Size
            </label>
            <div className="flex gap-2">
              {[
                { value: '1024x1024', label: 'Square (1:1)' },
                { value: '1792x1024', label: 'Landscape (16:9)' },
                { value: '1024x1792', label: 'Portrait (9:16)' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSize(option.value as ImageSize)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    size === option.value
                      ? 'bg-tech-olive/20 text-tech-olive border border-tech-olive/30'
                      : 'bg-warm-ivory/5 text-warm-ivory/60 border border-warm-ivory/10 hover:bg-warm-ivory/10'
                  }`}
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-warm-ivory/60">
                Preview
              </label>
              <div className="relative rounded-lg overflow-hidden bg-warm-ivory/5">
                <img
                  src={preview.url}
                  alt={prompt}
                  className="w-full h-auto"
                />
                {preview.temporary && (
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-yellow-500/20 text-yellow-300 text-xs">
                    Temporary URL - Image not saved to storage
                  </div>
                )}
              </div>
              {preview.revisedPrompt && preview.revisedPrompt !== prompt && (
                <p className="text-xs text-warm-ivory/40">
                  <span className="font-medium">DALL-E revised prompt:</span>{' '}
                  {preview.revisedPrompt}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-ivory/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {preview && (
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-4 py-2 text-sm text-warm-ivory/60 hover:text-warm-ivory transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
            )}

            {preview ? (
              <button
                onClick={handleInsert}
                className="px-4 py-2 text-sm bg-tech-olive text-void-black rounded-lg hover:bg-tech-olive/90 transition-colors"
              >
                Insert Image
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-4 py-2 text-sm bg-tech-olive text-void-black rounded-lg hover:bg-tech-olive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-void-black/30 border-t-void-black rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

export default ImageGenerationModal;
