/** Studio → Go live is a chrome takeover (no StudioNav / sidebar). */
export function isGoLiveTakeoverPath(pathname: string): boolean {
  return (
    pathname === '/studio/go-live' || pathname.startsWith('/studio/go-live/')
  );
}
