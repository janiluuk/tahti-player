import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { CircleHelpIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Button,
  ButtonLink,
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
import { ChannelStoreEditor } from '../../components/ChannelStoreEditor';
import { FanSubOrderBreakdown } from '../../components/FanSubOrderBreakdown';
import { FanSubscriptionStats } from '../../components/FanSubscriptionStats';
import { FanTiersEditor } from '../../components/FanTiersEditor';
import { PageEmpty, PageError } from '../../components/PageStates';
import { PurchaseOrdersList } from '../../components/PurchaseOrdersList';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';
import {
  movedSettingsSection,
  movedSettingsSectionLabel,
} from '../../lib/movedSettingsSections';
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
  const search = useSearch({ strict: false }) as {
    tab?: string;
    movedFrom?: unknown;
  };
  const showTiers = search.tab === 'tiers';
  const movedFrom = movedSettingsSection(search.movedFrom);
  const [connect, setConnect] = useState<FanConnectStatus | null>(null);
  const [fanPayouts, setFanPayouts] = useState<FanPayoutStats | null>(null);
  const [hasFanTiers, setHasFanTiers] = useState<boolean | null>(null);
  const [tiersError, setTiersError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
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
        const tiersReason =
          tiersResult.meta.source === 'api'
            ? (tiersResult.meta.reason ?? null)
            : null;
        setTiersError(tiersReason);
        setHasFanTiers(
          tiersReason && tiersResult.data.length === 0
            ? null
            : tiersResult.data.length > 0,
        );
        setMergedOrders(
          mergeRevenueOrders(payoutsResult.data.recent, royaltiesResult.data),
        );
        setGrants(grantsResult.data);
        setEstimate(estimateResult.data);
      },
    );
  }, [attempt]);

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

  const dismissMovedNotice = () => {
    void navigate({
      to: '/studio/audience',
      search: showTiers ? { tab: 'tiers' } : {},
      replace: true,
    });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={showTiers ? 'Tiers' : 'Audience'}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          {movedFrom ? (
            <Alert
              tone="info"
              title="This page has moved"
              data-testid="settings-moved-notice"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Settings › {movedSettingsSectionLabel(movedFrom)} is now
                  Studio › {showTiers ? 'Tiers' : 'Audience'}. Update any
                  bookmark that pointed to the old address.
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={dismissMovedNotice}
                >
                  Dismiss
                </Button>
              </div>
            </Alert>
          ) : null}
          {!showTiers ? (
            <div className="flex items-center gap-2">
              <ButtonLink
                to="/help/$slug"
                params={{ slug: 'earnings' }}
                size="sm"
                variant="secondary"
              >
                Earnings guide
              </ButtonLink>
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
                title="Channel store"
                description="Follow the steps. Nothing is for sale on your channel page until you put it in the Store."
              >
                <ChannelStoreEditor />
              </StudioPanel>
              <StudioPanel
                title="Track sales"
                description="Paid one-time purchases, newest first."
              >
                <PurchaseOrdersList />
              </StudioPanel>
            </div>
          ) : connect && !connect.stripeConfigured ? (
            <StudioPanel title="Payments">
              <PageEmpty
                data-testid="revenue-stripe-disconnected"
                title="Stripe is not connected"
                description="Connect Stripe before fan subscriptions, track sales, or grant payouts can reach you."
                action={
                  <ButtonLink to="/studio/stripe">Open Stripe setup</ButtonLink>
                }
              />
            </StudioPanel>
          ) : tiersError && hasFanTiers === null ? (
            <StudioPanel title="Fan subscriptions">
              <PageError
                title="Could not load your fan tiers"
                description={tiersError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            </StudioPanel>
          ) : hasFanTiers === false ? (
            <StudioPanel title="Fan subscriptions">
              <PageEmpty
                data-testid="fan-subs-empty-state"
                title="No fan subscriptions yet"
                description="Set up subscription tiers so fans can support you directly."
                action={<Button onClick={openTiers}>Open tiers editor</Button>}
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
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
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
                    <ButtonLink
                      to="/studio/stripe"
                      size="sm"
                      variant="secondary"
                    >
                      Open Stripe dashboard
                    </ButtonLink>
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
                  <PageEmpty title="No disbursements yet" />
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
