import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/** Splits `/path?query#hash` into router Link parts; the router does not
 * parse a query or hash out of `to`. */
export function splitHref(href: string): {
  to: string;
  search: Record<string, string>;
  hash?: string;
} {
  const [beforeHash = href, hash] = href.split('#');
  const [to = beforeHash, query] = beforeHash.split('?');
  return {
    to,
    search: Object.fromEntries(new URLSearchParams(query ?? '')),
    ...(hash ? { hash } : {}),
  };
}

export function renderHubLink(
  href: string,
  children: ReactNode,
  className: string,
) {
  const { to, search, hash } = splitHref(href);
  return (
    <Link to={to} search={search} hash={hash} className={className}>
      {children}
    </Link>
  );
}
