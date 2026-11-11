import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import {
  computeFanSubSplit,
  eurosFromCents,
  EXAMPLE_FAN_SUB_GROSS_CENTS,
} from '../lib/fanSubSplit';

const split = computeFanSubSplit(EXAMPLE_FAN_SUB_GROSS_CENTS);

export const FanSubOrderBreakdown: FC = () => {
  const { t } = useTranslation('web');
  const lines: Array<{
    label: string;
    amount: string;
    className: string;
    total?: boolean;
  }> = [
    {
      label: t('fanSubOrderBreakdownLeftovers.fanPays'),
      amount: eurosFromCents(split.grossCents),
      className: 'text-foreground',
    },
    {
      label: t('fanSubOrderBreakdownLeftovers.stripeFees'),
      amount: `−${eurosFromCents(split.stripeFeeCents)}`,
      className: 'text-accent-orange-strong',
    },
    {
      label: t('fanSubOrderBreakdownLeftovers.tahtiOpsFee'),
      amount: `−${eurosFromCents(split.orgFeeCents)}`,
      className: 'text-accent-cyan-strong',
    },
    {
      label: t('fanSubOrderBreakdownLeftovers.youReceive'),
      amount: eurosFromCents(split.netToArtistCents),
      className: 'text-accent-green-strong font-semibold',
      total: true,
    },
  ];
  return (
    <div data-tour-id="revenue-flow" data-testid="fan-order-flow">
      <h3 className="text-sm font-bold">
        {t('fanSubOrderBreakdownLeftovers.whereGoes')}
      </h3>
      <p className="text-foreground-secondary mt-1 text-xs">
        {t('fanSubOrderBreakdown.everyFanSubOrderSplits')}
      </p>
      <dl className="border-border divide-border mt-3 divide-y overflow-hidden rounded-lg border">
        {lines.map((line) => (
          <div
            key={line.label}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm ${
              line.total ? 'bg-background-secondary/60' : 'bg-background'
            }`}
          >
            <dt>{line.label}</dt>
            <dd className={`tabular-nums ${line.className}`}>{line.amount}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs">
        <Link
          to="/help/$slug"
          params={{ slug: 'earnings' }}
          data-tour-id="revenue-help"
          className="text-foreground underline-offset-2 hover:underline"
        >
          {t('fanSubOrderBreakdown.moreAboutEarningsInThe')}
        </Link>
      </p>
    </div>
  );
};
