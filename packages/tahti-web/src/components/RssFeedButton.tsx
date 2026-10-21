import { RssIcon } from 'lucide-react';

import { CopyButton } from '@tahti-player/ui';

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
    <CopyButton
      text={href}
      icon={<RssIcon size={16} aria-hidden />}
      variant="secondary"
      aria-label={`Copy the ${label}`}
      toastMessage="Feed link copied. Paste it into your podcast app."
      errorMessage="Could not copy the feed link."
      className={className}
    />
  );
}
