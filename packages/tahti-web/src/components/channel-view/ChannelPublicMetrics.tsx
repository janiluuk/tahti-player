import { useTranslation } from '@tahti-player/i18n';

import type { PublicChannel } from '../../api/types';
import { dateLocaleTag } from '../../lib/locale';
import {
  buildChannelPublicMetricRows,
  type ChannelPublicMetricRow,
} from './channelPublicMetrics';

export function ChannelPublicMetrics({
  channel,
  className,
}: {
  channel: Pick<
    PublicChannel,
    'followerCount' | 'followingCount' | 'metrics' | 'publicPlays'
  >;
  className?: string;
}) {
  const { t } = useTranslation('web');
  const rows = buildChannelPublicMetricRows(channel, {
    playsToday: t('channelPublicMetrics.playsToday'),
    playsYesterday: t('channelPublicMetrics.playsYesterday'),
  });
  if (rows.length === 0) {
    return null;
  }
  return (
    <ChannelPublicMetricsList
      rows={rows}
      className={className}
      ariaLabel={t('channelPublicMetrics.title')}
    />
  );
}

export function ChannelPublicMetricsList({
  rows,
  className,
  ariaLabel,
}: {
  rows: ChannelPublicMetricRow[];
  className?: string;
  ariaLabel: string;
}) {
  const locale = dateLocaleTag();
  return (
    <ul
      className={`flex flex-col gap-2 ${className ?? ''}`.trim()}
      aria-label={ariaLabel}
      data-testid="channel-public-metrics"
    >
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <li
            key={row.key}
            className="flex items-center gap-3"
            data-metric={row.key}
          >
            <Icon
              size={16}
              className="text-foreground-secondary shrink-0"
              aria-hidden
            />
            <span className="font-display text-foreground text-base font-bold tracking-tight tabular-nums">
              {row.value.toLocaleString(locale)}
            </span>
            <span className="text-foreground-secondary text-sm">
              {row.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
