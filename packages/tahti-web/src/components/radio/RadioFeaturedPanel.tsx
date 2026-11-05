import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';

import type { RadioFeatureHistoryItem } from '../../api/radio-public';
import { PageEmpty, PageError } from '../PageStates';
import { formatRadioAgo } from './RadioJustPlayedPanel';

/** Tahti Radio → Featured: member channels recently relayed on air. */
export function RadioFeaturedPanel({
  items,
  error,
  onRetry,
}: {
  items: RadioFeatureHistoryItem[];
  error?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');

  if (error && items.length === 0) {
    return (
      <PageError
        title={t('radio.memberSetsError')}
        description={error}
        onRetry={onRetry}
      />
    );
  }
  if (items.length === 0) {
    return <PageEmpty title={t('radio.memberSetsEmpty')} />;
  }

  return (
    <ul
      className="border-border divide-border divide-y overflow-hidden rounded-lg border"
      data-testid="radio-featured"
    >
      {items.map((item) => (
        <li
          key={`${item.channelId}-${item.featuredAt}`}
          className="flex items-center gap-3 px-3 py-2"
        >
          <Link
            to="/channel/$slug"
            params={{ slug: item.slug }}
            className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline"
          >
            {item.artistName || item.slug}
          </Link>
          <span className="text-foreground-secondary shrink-0 text-xs">
            {formatRadioAgo(item.featuredAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
