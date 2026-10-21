/**
 * Shared inset for AppShell main panes and Settings modal content.
 * Matches Nuclear ViewShell density (`px-6` at md+).
 */
export const MAIN_CONTENT_PADDING = 'p-6 md:p-8';

/**
 * Pages that paint their own background to the pane edges (they cancel the
 * inset with negative margins). The inset has to scroll with them, or the
 * scrollport clips what the margins pull out.
 */
export function isFullBleedRoute(pathname: string): boolean {
  return /^\/(channel|t)\/[^/]+\/?$/.test(pathname);
}
