import { RssIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Tooltip } from '@tahti-player/ui';

export function RssFeedButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      toast.success('Feed link copied. Paste it into your podcast app.');
    } catch {
      toast.error('Could not copy the feed link.');
    }
  };

  return (
    <Tooltip content="Copy RSS feed link" side="top">
      <Button
        size="icon-sm"
        variant="secondary"
        aria-label={`Copy the ${label}`}
        className={className}
        onClick={() => void copy()}
      >
        <RssIcon size={16} aria-hidden />
      </Button>
    </Tooltip>
  );
}
