import {
  CalendarCheckIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  DownloadIcon,
  UsersIcon,
} from 'lucide-react';
import type { FC, ReactNode } from 'react';

import { Badge } from '@tahti-player/ui';

import type { FanPayoutStats } from '../api/revenue';
import type { RevenueOrderRow } from '../lib/revenueOrders';

type FanSubscriptionStatsProps = {
  stats: FanPayoutStats;
  orders: RevenueOrderRow[];
  exportUrl?: string;
  footnote?: ReactNode;
};

const euros = (cents: number): string => `€${(cents / 100).toFixed(2)}`;

function payoutStateColor(
  state: string,
): 'green' | 'orange' | 'red' | 'secondary' {
  if (state === 'PAID' || state === 'COMPLETED') {
    return 'green';
  }
  if (state === 'FAILED') {
    return 'red';
  }
  if (state === 'PENDING' || state === 'PROCESSING') {
    return 'orange';
  }
  return 'secondary';
}

const FanStat: FC<{
  label: string;
  value: string;
  icon: typeof UsersIcon;
}> = ({ label, value, icon: Icon }) => (
  <div
    role="group"
    aria-label={`${label}: ${value}`}
    className="border-border bg-background flex max-w-full min-w-0 flex-col gap-2 overflow-hidden rounded-lg border p-3"
  >
    <span className="text-foreground-secondary flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-wide break-words uppercase">
      <Icon size={14} aria-hidden className="text-primary" />
      {label}
    </span>
    <strong className="font-display text-2xl font-extrabold tabular-nums">
      {value}
    </strong>
  </div>
);

export const FanSubscriptionStats: FC<FanSubscriptionStatsProps> = ({
  stats,
  orders,
  exportUrl,
  footnote,
}) => (
  <section
    aria-label="Fan subscription summary"
    className="flex max-w-full min-w-0 flex-col gap-4"
  >
    <div
      data-tour-id="revenue-stats"
      data-testid="fan-order-stats"
      className="grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-[repeat(4,minmax(0,1fr))]"
    >
      <FanStat
        label="Active subscribers"
        value={stats.activeSubscribers.toLocaleString()}
        icon={UsersIcon}
      />
      <FanStat
        label="This month"
        value={euros(stats.thisMonthNetCents)}
        icon={CircleDollarSignIcon}
      />
      <FanStat
        label="Paid out YTD"
        value={euros(stats.paidYtdNetCents)}
        icon={CalendarCheckIcon}
      />
      <FanStat
        label="Pending payouts"
        value={stats.pending.toLocaleString()}
        icon={Clock3Icon}
      />
    </div>

    <div className="text-foreground-secondary flex flex-wrap items-center justify-between gap-2 text-xs">
      <p>
        Paid in the last 30 days: {stats.paidLast30Days.toLocaleString()}
        {stats.failed > 0 ? (
          <span className="text-accent-red-strong">
            {' '}
            · Failed payouts: {stats.failed.toLocaleString()}
          </span>
        ) : (
          ' · No failed payouts'
        )}
      </p>
      {exportUrl ? (
        <a
          href={exportUrl}
          className="text-foreground inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline"
        >
          <DownloadIcon size={14} aria-hidden />
          Export subscribers
        </a>
      ) : null}
    </div>

    <div data-tour-id="revenue-orders" data-testid="fan-order-list">
      <h3 className="mb-2 text-sm font-bold">Payout history</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[430px] text-left text-sm">
          <thead className="text-foreground-secondary text-[11px] tracking-wide uppercase">
            <tr className="border-border border-b">
              <th className="px-2 py-2 font-semibold">Date</th>
              <th className="px-2 py-2 font-semibold">Description</th>
              <th className="px-2 py-2 font-semibold">Gross</th>
              <th className="px-2 py-2 font-semibold">Net to you</th>
              <th className="px-2 py-2 font-semibold">State</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-foreground-secondary px-2 py-4 text-center"
                >
                  No payouts yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="text-foreground-secondary px-2 py-2.5">
                    {order.date.toLocaleDateString()}
                  </td>
                  <td className="px-2 py-2.5 font-medium">
                    {order.description}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums">
                    {order.grossCents == null ? '—' : euros(order.grossCents)}
                  </td>
                  <td className="px-2 py-2.5 font-semibold tabular-nums">
                    {order.state === 'PENDING' ? '—' : euros(order.netCents)}
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge variant="pill" color={payoutStateColor(order.state)}>
                      {order.state}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footnote ? (
        <p className="text-foreground-secondary mt-3 text-xs">{footnote}</p>
      ) : null}
    </div>
  </section>
);
