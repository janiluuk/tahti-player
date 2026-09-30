import { RssIcon } from 'lucide-react';

import { ButtonAnchor, Tooltip } from '@tahti-player/ui';

export function RssFeedButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Tooltip content={label} side="top">
      <ButtonAnchor
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        type="application/rss+xml"
        size="icon-sm"
        variant="secondary"
        aria-label={label}
        className={className}
      >
        <RssIcon size={16} aria-hidden />
      </ButtonAnchor>
    </Tooltip>
  );
}
