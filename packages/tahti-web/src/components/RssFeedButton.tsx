import { RssIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <CopyButton
      text={href}
      icon={<RssIcon size={16} aria-hidden />}
      variant="secondary"
      aria-label={t('rssFeedButtonLabels.copyTheLabel', { label })}
      toastMessage="Feed link copied. Paste it into your podcast app."
      errorMessage="Could not copy the feed link."
      className={className}
    />
  );
}
