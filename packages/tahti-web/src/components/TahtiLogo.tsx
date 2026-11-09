import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { TahtiLogo } from '@tahti-player/ui';

import { cn } from '../lib/cn';

export { TahtiLogo, TahtiMark } from '@tahti-player/ui';

export function TahtiLogoLink({
  className,
  markOnly,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  const { t } = useTranslation('web');
  return (
    <Link
      to="/"
      className={cn('hover:opacity-90', className)}
      aria-label={t('tahtiLogoText.tahtiHome')}
    >
      <TahtiLogo markOnly={markOnly} />
    </Link>
  );
}
