/**
 * Story `beforeEach` that puts `search` (e.g. `?token=abc`) on the preview
 * URL for the views that read `window.location.search` directly instead of
 * the router, and restores the previous URL afterwards.
 */
export function withLocationSearch(search: string) {
  return () => {
    const previous = window.location.href;
    const next = new URL(previous);
    next.search = search;
    window.history.replaceState(window.history.state, '', next);
    return () => {
      window.history.replaceState(window.history.state, '', previous);
    };
  };
}
