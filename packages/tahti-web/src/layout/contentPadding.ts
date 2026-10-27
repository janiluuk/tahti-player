/**
 * Shared inset for AppShell main panes and Settings modal content.
 * Matches Nuclear ViewShell density (`px-6` at md+).
 */
export const MAIN_CONTENT_PADDING = 'p-6 md:p-8';

/** Pulls the scrollport's right edge into Main's padding by the same amount
 * it pads back, so the offset shadow of the rightmost control isn't clipped
 * by the scrollport's overflow. */
export const MAIN_SCROLLPORT_SHADOW_ROOM = '-mr-2 pr-2';

/**
 * Pages that paint their own background to the pane edges (they cancel the
 * inset with negative margins). The inset has to scroll with them, or the
 * scrollport clips what the margins pull out.
 */
export function isFullBleedRoute(pathname: string): boolean {
  return /^\/(channel|t)\/[^/]+\/?$/.test(pathname);
}
