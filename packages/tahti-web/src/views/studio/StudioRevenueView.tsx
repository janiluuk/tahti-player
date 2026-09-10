import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { CircleHelpIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  EmptyState,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAllRoyalties } from '../../api/distribution';
import { fetchMyFanTiers } from '../../api/fan-tiers';
import {
  fanSubscriberExportUrl,
  fetchFanConnectStatus,
  fetchFanPayoutStats,
  fetchGrantEstimate,
  fetchMyGrants,
  type FanConnectStatus,
  type FanPayoutStats,
  type GrantEstimate,
  type GrantRow,
} from '../../api/revenue';
import { FanSubOrderBreakdown } from '../../components/FanSubOrderBreakdown';
import { FanSubscriptionStats } from '../../components/FanSubscriptionStats';
import { FanTiersEditor } from '../../components/FanTiersEditor';
import { PurchaseTiersEditor } from '../../components/PurchaseTiersEditor';
import { StudioGate } from '../../components/StudioGate';
import { AudienceSubNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';
import { mergeRevenueOrders } from '../../lib/revenueOrders';
import { useTourStore } from '../../stores/tourStore';

function euros(cents: number | string): string {
  const n = typeof cents === 'string' ? Number(cents) : cents;
  if (!Number.isFinite(n)) {
    return '—';
  }
  return `€${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

export function StudioRevenueView() {
  const openTour = useTourStore((state) => state.start);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const showTiers = search.tab === 'tiers';
  const [connect, setConnect] = useState<FanConnectStatus | null>(null);
  const [fanPayouts, setFanPayouts] = useState<FanPayoutStats | null>(null);
  const [hasFanTiers, setHasFanTiers] = useState<boolean | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [estimate, setEstimate] = useState<GrantEstimate | null>(null);
  const [mergedOrders, setMergedOrders] = useState(mergeRevenueOrders([], []));

  useEffect(() => {
    void Promise.all([
      fetchFanConnectStatus(),
      fetchFanPayoutStats(),
      fetchMyFanTiers(),
      fetchAllRoyalties(),
      fetchMyGrants(),
      fetchGrantEstimate(),
    ]).then(
      ([
        connectResult,
        payoutsResult,
        tiersResult,
        royaltiesResult,
        grantsResult,
        estimateResult,
      ]) => {
        setConnect(connectResult.data);
        setFanPayouts(payoutsResult.data);
        setHasFanTiers(tiersResult.data.length > 0);
        setMergedOrders(
          mergeRevenueOrders(payoutsResult.data.recent, royaltiesResult.data),
        );
        setGrants(grantsResult.data);
        setEstimate(estimateResult.data);
      },
    );
  }, []);

  const showConnectWarning = useMemo(
    () =>
      hasFanTiers === true &&
      connect != null &&
      connect.stripeConfigured &&
      !connect.paymentsReady,
    [connect, hasFanTiers],
  );

  const openTiers = () => {
    void navigate({ to: '/studio/audience', search: { tab: 'tiers' } });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <AudienceSubNav
          current={
            showTiers ? '/studio/audience?tab=tiers' : '/studio/audience'
          }
        />
        <ViewShell
          title={showTiers ? 'Tiers' : 'Audience'}
          classes={{ root: 'px-0 pt-0' }}
        >
          {!showTiers ? (
            <div className="flex items-center gap-2">
              <Link to="/help/$slug" params={{ slug: 'earnings' }}>
                <Button size="sm" variant="secondary">
                  Earnings guide
                </Button>
              </Link>
              <Tooltip content="Help" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Help — take a guided tour of order management"
                  onClick={() => openTour()}
                >
                  <CircleHelpIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </div>
          ) : null}

          {showTiers ? (
            <div className="flex flex-col gap-4">
              <StudioPanel
                title="Fan subscription tiers"
                description="Set the monthly support tiers fans can subscribe to."
              >
                <FanTiersEditor />
              </StudioPanel>
              <StudioPanel
                title="One-time purchase tiers"
                description="Sell individual tracks. Assign a tier to a track from its edit dialog."
              >
                <PurchaseTiersEditor />
              </StudioPanel>
            </div>
          ) : hasFanTiers === false ? (
            <StudioPanel title="Fan subscriptions">
              <EmptyState
                size="sm"
                data-testid="fan-subs-empty-state"
                title="No fan subscriptions yet"
                description="Set up subscription tiers so fans can support you directly."
                action={
                  <Button size="sm" onClick={openTiers}>
                    Open tiers editor
                  </Button>
                }
              />
            </StudioPanel>
          ) : (
            <>
              {showConnectWarning ? (
                <Alert
                  tone="error"
                  role="status"
                  data-testid="fan-subs-connect-warning"
                >
                  Stripe is not connected yet — fan-sub payouts cannot reach you
                  until Connect shows payments ready. Finish onboarding on the{' '}
                  <Link
                    to="/studio/stripe"
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    Stripe dashboard
                  </Link>
                  .
                </Alert>
              ) : null}

              {fanPayouts ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
                  <StudioPanel
                    title="Order management"
                    description="Subscribers, net revenue, payout health, and recent fan-sub plus distribution payouts."
                  >
                    <FanSubscriptionStats
                      stats={fanPayouts}
                      orders={mergedOrders}
                      exportUrl={fanSubscriberExportUrl()}
                    />
                  </StudioPanel>
                  <StudioPanel
                    title="Order flow"
                    description="What happens to a typical €5 monthly order."
                  >
                    <FanSubOrderBreakdown />
                  </StudioPanel>
                </div>
              ) : null}

              {connect?.stripeConfigured ? (
                <StudioPanel
                  title="Stripe"
                  description="Payout account and Express dashboard — only listed in Studio when Stripe is enabled."
                >
                  <div data-tour-id="revenue-connect">
                    <Link to="/studio/stripe">
                      <Button size="sm" variant="secondary">
                        Open Stripe dashboard
                      </Button>
                    </Link>
                  </div>
                </StudioPanel>
              ) : null}

              {estimate && (
                <StudioPanel title={`Grant estimate (${estimate.year})`}>
                  <StatNumber className="block">
                    {euros(estimate.estimateCents)}
                  </StatNumber>
                  <p className="text-foreground-secondary mt-1 text-sm">
                    {estimate.units} engagement units
                    {estimate.eligible
                      ? ', eligible'
                      : ', not yet eligible (need more units)'}
                  </p>
                </StudioPanel>
              )}

              <StudioPanel title="Past grants">
                {grants.length === 0 ? (
                  <EmptyState size="sm" title="No disbursements yet" />
                ) : (
                  <ul className="divide-border divide-y">
                    {grants.map((g) => (
                      <li
                        key={`${g.forYear}-${g.state}`}
                        className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                      >
                        <span>
                          {g.forYear} — {g.state}
                        </span>
                        <span className="font-medium">
                          {euros(g.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </StudioPanel>
            </>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
