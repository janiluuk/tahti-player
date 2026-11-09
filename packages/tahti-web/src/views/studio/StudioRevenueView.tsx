import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { CircleHelpIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  const openTour = useTourStore((state) => state.start);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    tab?: string;
    movedFrom?: unknown;
  };
  const showTiers = search.tab === 'tiers';
  const showStore = search.tab === 'store';
  const pageTitle = showTiers
    ? 'Memberships'
    : showStore
      ? t('studioRevenueViewStates.store')
      : t('studioRevenueViewStates.earnings');
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
      search: showTiers
        ? { tab: 'tiers' as const }
        : showStore
          ? { tab: 'store' as const }
          : {},
      replace: true,
    });
  };

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={pageTitle}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          {movedFrom ? (
            <Alert
              tone="info"
              title={t('studioRevenue2.thisPageHasMoved')}
              data-testid="settings-moved-notice"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Settings › {movedSettingsSectionLabel(movedFrom)} is now
                  Studio › Fans › {pageTitle}. Update any bookmark that pointed
                  to the old address.
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={dismissMovedNotice}
                >
                  {t('studioRevenue2.dismiss')}
                </Button>
              </div>
            </Alert>
          ) : null}
          {!showTiers && !showStore ? (
            <div className="flex items-center gap-2">
              <ButtonLink
                to="/help/$slug"
                params={{ slug: 'earnings' }}
                size="sm"
                variant="secondary"
              >
                {t('studioRevenue2.earningsGuide')}
              </ButtonLink>
              <Tooltip content={t('studioRevenue2.help')} side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label={t('studioRevenue2.helpTakeAGuidedTour')}
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
                title={t('studioRevenue2.fanSubscriptionTiers')}
                description={t('studioRevenue2.setTheMonthlySupportTiers')}
              >
                <FanTiersEditor />
              </StudioPanel>
            </div>
          ) : showStore ? (
            <div className="flex flex-col gap-4">
              <StudioPanel
                title={t('studioRevenue2.channelStore')}
                description={t('studioRevenue2.followTheStepsNothingIs')}
              >
                <ChannelStoreEditor />
              </StudioPanel>
              <StudioPanel
                title={t('studioRevenue2.trackSales')}
                description={t('studioRevenue2.paidOneTimePurchasesNewest')}
              >
                <PurchaseOrdersList />
              </StudioPanel>
            </div>
          ) : connect && !connect.stripeConfigured ? (
            <StudioPanel title={t('studioRevenue2.payments')}>
              <PageEmpty
                data-testid="revenue-stripe-disconnected"
                title={t('empties.stripeIsNotConnected')}
                description={t(
                  'empties.connectStripeBeforeFanSubscriptionsTrack',
                )}
                action={
                  <ButtonLink to="/studio/stripe">
                    {t('studioRevenue2.openStripeSetup')}
                  </ButtonLink>
                }
              />
            </StudioPanel>
          ) : tiersError && hasFanTiers === null ? (
            <StudioPanel title={t('studioRevenue2.fanSubscriptions')}>
              <PageError
                title={t('loadErrors.couldNotLoadYourFanTiers')}
                description={tiersError}
                onRetry={() => setAttempt((n) => n + 1)}
              />
            </StudioPanel>
          ) : hasFanTiers === false ? (
            <StudioPanel title={t('studioRevenue.fanSubsTitle')}>
              <PageEmpty
                data-testid="fan-subs-empty-state"
                title={t('studioRevenue.emptyFanSubsTitle')}
                description={t('studioRevenue.emptyFanSubsDescription')}
                action={
                  <Button variant="secondary" onClick={openTiers}>
                    {t('studioRevenue.openTiers')}
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
                    {t('studioRevenue2.stripeDashboard')}
                  </Link>
                  .
                </Alert>
              ) : null}

              {fanPayouts ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,1fr)]">
                  <StudioPanel
                    title={t('studioRevenue2.orderManagement')}
                    description={t(
                      'studioRevenue2.subscribersNetRevenuePayoutHealth',
                    )}
                  >
                    <FanSubscriptionStats
                      stats={fanPayouts}
                      orders={mergedOrders}
                      exportUrl={fanSubscriberExportUrl()}
                    />
                  </StudioPanel>
                  <StudioPanel
                    title={t('studioRevenue2.orderFlow')}
                    description={t('studioRevenue2.whatHappensToATypical')}
                  >
                    <FanSubOrderBreakdown />
                  </StudioPanel>
                </div>
              ) : null}

              {connect?.stripeConfigured ? (
                <StudioPanel
                  title={t('studioRevenue2.stripe')}
                  description={t(
                    'studioRevenue2.payoutAccountAndExpressDashboard',
                  )}
                >
                  <div data-tour-id="revenue-connect">
                    <ButtonLink
                      to="/studio/stripe"
                      size="sm"
                      variant="secondary"
                    >
                      {t('studioRevenue2.openStripeDashboard')}
                    </ButtonLink>
                  </div>
                </StudioPanel>
              ) : null}

              {estimate && (
                <StudioPanel
                  title={t('studioRevenueViewLabels.grantEstimateYear', {
                    year: estimate.year,
                  })}
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

              <StudioPanel title={t('studioRevenue2.pastGrants')}>
                {grants.length === 0 ? (
                  <PageEmpty title={t('studioRevenue.emptyDisbursements')} />
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
