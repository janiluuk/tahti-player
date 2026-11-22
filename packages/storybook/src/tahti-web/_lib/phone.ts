/**
 * Story `beforeEach` that makes `useIsMobile` / `usePhoneViewport` see a
 * phone. Only the JS media query changes: Tailwind breakpoints still follow
 * the real canvas width, so CSS-only phone layouts need a narrow container
 * or `@container` variants to show in a story.
 */
export function stubPhoneViewport(): () => void {
  const real = window.matchMedia;
  window.matchMedia = (query: string) =>
    query === '(max-width: 767px)'
      ? ({
          matches: true,
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        } as MediaQueryList)
      : real.call(window, query);
  return () => {
    window.matchMedia = real;
  };
}
