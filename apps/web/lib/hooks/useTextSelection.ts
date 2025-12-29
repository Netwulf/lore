/**
 * Text Selection Hook for AI Inline Actions
 * Story: LORE-3.6 - AI Inline Actions
 *
 * Tracks text selection within the editor and provides position
 * information for the floating AI toolbar.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TextSelection {
  text: string;
  position: {
    top: number;
    left: number;
  };
}

export interface UseTextSelectionOptions {
  minLength?: number;
  containerRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const { minLength = 10, containerRef, enabled = true } = options;

  const [selection, setSelection] = useState<TextSelection | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (!enabled) {
      setSelection(null);
      return;
    }

    const windowSelection = window.getSelection();

    if (!windowSelection || windowSelection.isCollapsed) {
      setSelection(null);
      return;
    }

    const text = windowSelection.toString().trim();

    // Check minimum length
    if (text.length < minLength) {
      setSelection(null);
      return;
    }

    // Check if selection is within container (if specified)
    if (containerRef?.current) {
      const range = windowSelection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
    }

    // Get position for the toolbar
    const range = windowSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position toolbar above the selection, centered
    const position = {
      top: rect.top + window.scrollY - 10, // 10px above selection
      left: rect.left + window.scrollX + rect.width / 2 - 75, // Centered (assuming ~150px toolbar width)
    };

    // Ensure toolbar doesn't go off-screen
    position.left = Math.max(10, position.left);
    position.left = Math.min(window.innerWidth - 170, position.left);
    position.top = Math.max(10, position.top);

    setSelection({ text, position });
  }, [enabled, minLength, containerRef]);

  useEffect(() => {
    if (!enabled) return;

    // Debounce selection changes to avoid flickering
    const debouncedHandler = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleSelectionChange, 200);
    };

    document.addEventListener('selectionchange', debouncedHandler);
    document.addEventListener('mouseup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', debouncedHandler);
      document.removeEventListener('mouseup', handleSelectionChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleSelectionChange]);

  return {
    selection,
    clearSelection,
    hasSelection: selection !== null,
  };
}

export default useTextSelection;
