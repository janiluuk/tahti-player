import {
  CalendarCheckIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  DownloadIcon,
  UsersIcon,
} from 'lucide-react';
import type { FC, ReactNode } from 'react';

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
} from '@tahti-player/ui';

import type { FanPayoutStats } from '../api/revenue';
import type { RevenueOrderRow } from '../lib/revenueOrders';
import { PageEmpty } from './PageStates';

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
      <Icon size={14} aria-hidden className="text-primary-strong shrink-0" />
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
    className="@container flex max-w-full min-w-0 flex-col gap-4"
  >
    <div
      data-tour-id="revenue-stats"
      data-testid="fan-order-stats"
      className="grid min-w-0 grid-cols-1 gap-2 @[16rem]:grid-cols-2 @xl:grid-cols-[repeat(4,minmax(0,1fr))]"
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
      <HorizontalScroll label="Payout history">
        <DataTable className="min-w-[430px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Date</DataTableHeaderCell>
              <DataTableHeaderCell>Description</DataTableHeaderCell>
              <DataTableHeaderCell>Gross</DataTableHeaderCell>
              <DataTableHeaderCell>Net to you</DataTableHeaderCell>
              <DataTableHeaderCell>State</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {orders.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={5} className="py-4">
                  <PageEmpty title="No payouts yet." />
                </DataTableCell>
              </DataTableRow>
            ) : (
              orders.map((order) => (
                <DataTableRow key={order.id}>
                  <DataTableCell className="text-foreground-secondary">
                    {order.date.toLocaleDateString()}
                  </DataTableCell>
                  <DataTableCell className="font-medium">
                    {order.description}
                  </DataTableCell>
                  <DataTableCell className="tabular-nums">
                    {order.grossCents == null ? '—' : euros(order.grossCents)}
                  </DataTableCell>
                  <DataTableCell className="font-semibold tabular-nums">
                    {order.state === 'PENDING' ? '—' : euros(order.netCents)}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="pill" color={payoutStateColor(order.state)}>
                      {order.state}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </HorizontalScroll>
      {footnote ? (
        <p className="text-foreground-secondary mt-3 text-xs">{footnote}</p>
      ) : null}
    </div>
  </section>
);
