import { RssIcon } from 'lucide-react';

import { i18n, useTranslation } from '@tahti-player/i18n';
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
      toastMessage={i18n.t('web:batch51.feedLinkCopied')}
      errorMessage={t('uiLabels.copyFeedFailed')}
      className={className}
    />
  );
}
