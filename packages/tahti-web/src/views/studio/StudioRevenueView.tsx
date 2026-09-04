import { Link } from '@tanstack/react-router';
import { CircleHelpIcon, LayersIcon, LayoutDashboardIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Alert, Button, Tabs, Tooltip, ViewShell } from '@tahti-player/ui';

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
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
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
  const [connect, setConnect] = useState<FanConnectStatus | null>(null);
  const [fanPayouts, setFanPayouts] = useState<FanPayoutStats | null>(null);
  const [hasFanTiers, setHasFanTiers] = useState<boolean | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [estimate, setEstimate] = useState<GrantEstimate | null>(null);
  const [audienceTab, setAudienceTab] = useState(0);
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

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <StudioNav current="/studio/revenue" />
        <ViewShell
          title="Audience"
          subtitle="Fan-sub orders, distribution royalties, payout statistics, and how each euro splits."
          classes={{ root: 'px-0 pt-0' }}
        >
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

          <Tabs
            selectedIndex={audienceTab}
            onChange={setAudienceTab}
            listClassName="border-border border-b pb-2"
            items={[
              {
                id: 'overview',
                label: 'Overview',
                icon: <LayoutDashboardIcon size={14} />,
                content:
                  hasFanTiers === false ? (
                    <StudioPanel title="Fan subscriptions">
                      <div
                        className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-lg border p-6 text-center"
                        data-testid="fan-subs-empty-state"
                      >
                        <p className="font-medium">No fan subscriptions yet.</p>
                        <p className="text-foreground-secondary text-sm">
                          Set up subscription tiers so fans can support you
                          directly — head to{' '}
                          <Link
                            to="/settings/$section"
                            params={{ section: 'fan-tiers' }}
                            className="text-foreground font-semibold underline-offset-2 hover:underline"
                          >
                            Settings → Fan tiers
                          </Link>{' '}
                          or use the Tiers tab here.
                        </p>
                        <Button size="sm" onClick={() => setAudienceTab(1)}>
                          Open tiers editor
                        </Button>
                      </div>
                    </StudioPanel>
                  ) : (
                    <>
                      {showConnectWarning ? (
                        <Alert
                          tone="error"
                          role="status"
                          data-testid="fan-subs-connect-warning"
                        >
                          Stripe is not connected yet — fan-sub payouts cannot
                          reach you until Connect shows payments ready. Finish
                          onboarding on the{' '}
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
                              footnote={
                                <>
                                  Subscriber CSV export and GDPR tools live in{' '}
                                  <Link
                                    to="/settings/$section"
                                    params={{ section: 'fan-subs' }}
                                    className="text-foreground font-semibold underline-offset-2 hover:underline"
                                  >
                                    Settings → Fan subs
                                  </Link>
                                  .
                                </>
                              }
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
                        <StudioPanel
                          title={`Grant estimate (${estimate.year})`}
                        >
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
                          <p className="text-foreground-secondary text-sm">
                            No disbursements yet.
                          </p>
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
                  ),
              },
              {
                id: 'tiers',
                label: 'Tiers',
                icon: <LayersIcon size={14} />,
                content: (
                  <StudioPanel
                    title="Tiers"
                    description="Set the monthly support tiers fans can subscribe to."
                  >
                    <FanTiersEditor />
                  </StudioPanel>
                ),
              },
            ]}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
}
