/**
 * Shared inset for AppShell main panes. Matches Nuclear ViewShell density
 * (`px-6` at md+); phones get a narrower gutter so content uses the width.
 * Full-bleed pages cancel it with `FULL_BLEED_CANCEL`, so keep the two in step.
 */
export const MAIN_CONTENT_PADDING = 'p-4 sm:p-6 md:p-8';

/** Negative margins that undo MAIN_CONTENT_PADDING on every side. */
export const FULL_BLEED_CANCEL = '-m-4 sm:-m-6 md:-m-8';

/** Undoes MAIN_CONTENT_PADDING's sides and top, then pads the content back
 * by the same amount, for pages that paint their own background behind it. */
export const FULL_BLEED_TOP_CANCEL =
  '-mx-4 -mt-4 p-4 sm:-mx-6 sm:-mt-6 sm:p-6 md:-mx-8 md:-mt-8 md:p-8';

/** FULL_BLEED_TOP_CANCEL without padding the content back. */
export const FULL_BLEED_TOP_CANCEL_FLUSH =
  '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-8 md:-mt-8';

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
