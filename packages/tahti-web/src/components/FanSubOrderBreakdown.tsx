import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import {
  computeFanSubSplit,
  eurosFromCents,
  EXAMPLE_FAN_SUB_GROSS_CENTS,
} from '../lib/fanSubSplit';

const split = computeFanSubSplit(EXAMPLE_FAN_SUB_GROSS_CENTS);

const LINES: Array<{
  label: string;
  amount: string;
  className: string;
  total?: boolean;
}> = [
  {
    label: 'Fan pays',
    amount: eurosFromCents(split.grossCents),
    className: 'text-foreground',
  },
  {
    label: 'Stripe fees',
    amount: `−${eurosFromCents(split.stripeFeeCents)}`,
    className: 'text-accent-orange-strong',
  },
  {
    label: 'Tahti ops fee (2%)',
    amount: `−${eurosFromCents(split.orgFeeCents)}`,
    className: 'text-accent-cyan-strong',
  },
  {
    label: 'You receive',
    amount: eurosFromCents(split.netToArtistCents),
    className: 'text-accent-green-strong font-semibold',
    total: true,
  },
];

export const FanSubOrderBreakdown: FC = () => (
  <div data-tour-id="revenue-flow" data-testid="fan-order-flow">
    <h3 className="text-sm font-bold">Where €5/mo goes</h3>
    <p className="text-foreground-secondary mt-1 text-xs">
      Every fan-sub order splits the same way — Stripe processing, a 2%
      operational fee, then the rest to you.
    </p>
    <dl className="border-border divide-border mt-3 divide-y overflow-hidden rounded-lg border">
      {LINES.map((line) => (
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
        More about earnings in the Help center
      </Link>
    </p>
  </div>
);
