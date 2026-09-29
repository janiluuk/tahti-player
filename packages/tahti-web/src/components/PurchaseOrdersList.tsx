import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button, EmptyState } from '@tahti-player/ui';

import {
  fetchMyPurchaseOrders,
  type PurchaseOrderRow,
} from '../api/purchase-tiers';
import { PageError, PageLoading } from './PageStates';

const PAGE_SIZE = 20;

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchMyPurchaseOrders().then((result) => {
      if (cancelled) {
        return;
      }
      setOrders(result.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (loading && !orders) {
    return <PageLoading label="Loading sales…" />;
  }
  if (!orders) {
    return (
      <PageError
        title="Couldn't load sales"
        onRetry={() => setAttempt((current) => current + 1)}
      />
    );
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        size="sm"
        title="No track sales yet"
        description="Paid purchases of your tracks show up here."
      />
    );
  }

  const total = orders.reduce((sum, order) => sum + order.amountCents, 0);
  const visible = showAll ? orders : orders.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-secondary text-xs">
        {orders.length} {orders.length === 1 ? 'sale' : 'sales'}, {euros(total)}{' '}
        before fees.
      </p>
      <ul
        className="divide-border divide-y text-sm"
        data-testid="purchase-orders"
      >
        {visible.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 py-2"
          >
            <span className="min-w-0">
              <span className="block font-medium">{order.tier.name}</span>
              <span className="text-foreground-secondary block text-xs">
                <Link
                  to="/u/$username"
                  params={{ username: order.buyer.username }}
                  className="hover:underline"
                >
                  {order.buyer.displayName || order.buyer.username}
                </Link>{' '}
                · {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </span>
            <span className="font-semibold tabular-nums">
              {euros(order.amountCents)}
            </span>
          </li>
        ))}
      </ul>
      {!showAll && orders.length > PAGE_SIZE ? (
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => setShowAll(true)}
        >
          Show all {orders.length}
        </Button>
      ) : null}
    </div>
  );
}
