import { useCallback, useEffect, useRef, useState } from 'react';

export function useFieldNavigator(): {
  highlightedFieldId: string | null;
  clearHighlight: () => void;
  jumpToField: (fieldId: string) => void;
  registerFieldRef: (fieldId: string, node: HTMLDivElement | null) => void;
} {
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightedFieldId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setHighlightedFieldId(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [highlightedFieldId]);

  const clearHighlight = useCallback(() => {
    setHighlightedFieldId(null);
  }, []);

  const jumpToField = useCallback((fieldId: string) => {
    const wrapper = fieldRefs.current[fieldId];
    if (!wrapper) {
      return;
    }

    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const target = wrapper.querySelector('input, textarea, [role="combobox"]') as HTMLElement | null;
    target?.focus();

    setHighlightedFieldId(fieldId);
  }, []);

  const registerFieldRef = useCallback((fieldId: string, node: HTMLDivElement | null) => {
    fieldRefs.current[fieldId] = node;
  }, []);

  return {
    highlightedFieldId,
    clearHighlight,
    jumpToField,
    registerFieldRef,
  };
}
