/**
 * Shared inset for AppShell main panes. Matches Nuclear ViewShell density
 * It is slightly tighter than ViewShell's built-in inset; phones get a
 * narrower gutter so content uses the width.
 * Full-bleed pages cancel it with `FULL_BLEED_CANCEL`, so keep the two in step.
 */
export const MAIN_CONTENT_PADDING = 'p-4 sm:p-5 md:p-7';

/** Negative margins that undo MAIN_CONTENT_PADDING on every side. */
export const FULL_BLEED_CANCEL = '-m-4 sm:-m-5 md:-m-7';

/** Undoes MAIN_CONTENT_PADDING's sides and top, then pads the content back
 * by the same amount, for pages that paint their own background behind it. */
export const FULL_BLEED_TOP_CANCEL =
  '-mx-4 -mt-4 p-4 sm:-mx-5 sm:-mt-5 sm:p-5 md:-mx-7 md:-mt-7 md:p-7';

/** FULL_BLEED_TOP_CANCEL without padding the content back. */
export const FULL_BLEED_TOP_CANCEL_FLUSH =
  '-mx-4 -mt-4 sm:-mx-5 sm:-mt-5 md:-mx-7 md:-mt-7';

/** MAIN_CONTENT_PADDING split around the scrollport: the pane keeps the top
 * and side inset, the scrolling content carries the bottom one, so pages
 * scroll right down to the player bar instead of stopping short of it. */
export const MAIN_PANE_INSET = 'px-5 pt-5 md:px-7 md:pt-7';
export const MAIN_SCROLL_BOTTOM_INSET = 'pb-5 md:pb-7';

/** Pulls the scrollport's right edge into Main's padding by the same amount
 * it pads back, so the offset shadow of the rightmost control isn't clipped
 * by the scrollport's overflow. */
export const MAIN_SCROLLPORT_SHADOW_ROOM = '-mr-3 pr-3';

/**
 * Pages that paint their own background to the pane edges (they cancel the
 * inset with negative margins). The inset has to scroll with them, or the
 * scrollport clips what the margins pull out.
 */
export function isFullBleedRoute(pathname: string): boolean {
  return /^\/(channel|t)\/[^/]+\/?$/.test(pathname);
}
