/**
 * Shared inset for AppShell main panes and Settings modal content.
 * Matches Nuclear ViewShell density (`px-6` at md+).
 */
export const MAIN_CONTENT_PADDING = 'p-6 md:p-8';

/** MAIN_CONTENT_PADDING split around the scrollport: the pane keeps the top
 * and side inset, the scrolling content carries the bottom one, so pages
 * scroll right down to the player bar instead of stopping short of it. */
export const MAIN_PANE_INSET = 'px-6 pt-6 md:px-8 md:pt-8';
export const MAIN_SCROLL_BOTTOM_INSET = 'pb-6 md:pb-8';

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
