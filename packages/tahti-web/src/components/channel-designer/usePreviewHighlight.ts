import { useEffect, useRef } from 'react';

type PreviewTab = 'header' | 'visualizer';

/** Flashes a preview section and scrolls it into view when the user picks a tab target. */
export function usePreviewHighlight(
  setHighlightSection: (section: PreviewTab | null) => void,
  setActiveTab: (tab: PreviewTab) => void,
) {
  const highlightTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(highlightTimerRef.current), []);

  const flashHighlight = (section: PreviewTab | null) => {
    window.clearTimeout(highlightTimerRef.current);
    setHighlightSection(section);
    if (section) {
      highlightTimerRef.current = window.setTimeout(
        () => setHighlightSection(null),
        1600,
      );
    }
  };

  const focusPreviewSection = (tab: PreviewTab, elementId: string) => {
    setActiveTab(tab);
    flashHighlight(tab);
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return { flashHighlight, focusPreviewSection };
}
