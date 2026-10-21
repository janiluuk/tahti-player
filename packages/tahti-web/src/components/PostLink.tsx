import { ExternalLink } from '@tahti-player/ui';

import { isHttpUrl } from '../lib/parseRss';

/** A news post's call-to-action link. Only http(s) addresses render, since
 * the API accepts any URL scheme. */
export function PostLink({
  linkUrl,
  linkLabel,
  className,
}: {
  linkUrl: string | null | undefined;
  linkLabel: string | null | undefined;
  className?: string;
}) {
  const href = linkUrl?.trim();
  if (!href || !isHttpUrl(href)) {
    return null;
  }
  return (
    <ExternalLink href={href} showIcon className={className}>
      {linkLabel?.trim() || new URL(href).host}
    </ExternalLink>
  );
}
