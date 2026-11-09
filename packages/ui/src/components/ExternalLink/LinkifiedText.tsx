import { FC, Fragment } from 'react';

import { ExternalLink } from './ExternalLink';

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]}]/g;

export function splitLinks(
  text: string,
): Array<{ kind: 'text' | 'link'; value: string }> {
  const parts: Array<{ kind: 'text' | 'link'; value: string }> = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ kind: 'text', value: text.slice(last, start) });
    }
    parts.push({ kind: 'link', value: match[0] });
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push({ kind: 'text', value: text.slice(last) });
  }
  return parts;
}

/** Plain text with any http(s) URLs in it rendered as links that open in
 * a new tab. */
export const LinkifiedText: FC<{ text: string; linkClassName?: string }> = ({
  text,
  linkClassName,
}) => (
  <>
    {splitLinks(text).map((part, index) =>
      part.kind === 'link' ? (
        <ExternalLink
          key={index}
          href={part.value}
          className={linkClassName ?? 'inline break-all'}
        >
          {part.value}
        </ExternalLink>
      ) : (
        <Fragment key={index}>{part.value}</Fragment>
      ),
    )}
  </>
);
