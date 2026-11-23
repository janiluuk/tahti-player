import { useNavigate, useSearch } from '@tanstack/react-router';
import { BookOpenIcon, CircleHelpIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink, OverflowMenu, ViewShell } from '@tahti-player/ui';

import { fetchAllRoyalties } from '../../api/distribution';
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
import { FanSubscriptionStats } from '../../components/FanSubscriptionStats';
import { FanTiersEditor } from '../../components/FanTiersEditor';
import { PageEmpty } from '../../components/PageStates';
import { PurchaseOrdersList } from '../../components/PurchaseOrdersList';
import { StudioGate } from '../../components/StudioGate';
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
  const { t } = useTranslation('web');
  const openTour = useTourStore((state) => state.start);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    tab?: string;
  };
  const showTiers = search.tab === 'tiers';
  const showStore = search.tab === 'store';
  const pageTitle = showTiers
    ? 'Memberships'
    : showStore
      ? t('studioRevenueViewStates.store')
      : t('studioRevenueViewStates.earnings');
  const [connect, setConnect] = useState<FanConnectStatus | null>(null);
  const [fanPayouts, setFanPayouts] = useState<FanPayoutStats | null>(null);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [estimate, setEstimate] = useState<GrantEstimate | null>(null);
  const [mergedOrders, setMergedOrders] = useState(mergeRevenueOrders([], []));

  useEffect(() => {
    void Promise.all([
      fetchFanConnectStatus(),
      fetchFanPayoutStats(),
      fetchAllRoyalties(),
      fetchMyGrants(),
      fetchGrantEstimate(),
    ]).then(
      ([
        connectResult,
        payoutsResult,
        royaltiesResult,
        grantsResult,
        estimateResult,
      ]) => {
        setConnect(connectResult.data);
        setFanPayouts(payoutsResult.data);
        setMergedOrders(
          mergeRevenueOrders(payoutsResult.data.recent, royaltiesResult.data),
        );
        setGrants(grantsResult.data);
        setEstimate(estimateResult.data);
      },
    );
  }, []);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={pageTitle}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
          actions={
            !showTiers && !showStore ? (
              <OverflowMenu
                label={t('studioRevenue2.moreActions')}
                data-testid="studio-revenue-more"
                items={[
                  {
                    id: 'guide',
                    label: t('studioRevenue2.earningsGuide'),
                    icon: <BookOpenIcon size={14} aria-hidden />,
                    onSelect: () => {
                      void navigate({
                        to: '/help/$slug',
                        params: { slug: 'earnings' },
                      });
                    },
                  },
                  {
                    id: 'tour',
                    label: t('studioRevenue2.helpTakeAGuidedTour'),
                    icon: <CircleHelpIcon size={14} aria-hidden />,
                    onSelect: () => openTour(),
                  },
                ]}
              />
            ) : undefined
          }
        >
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
          ) : (
            <>
              <StudioPanel title={t('studioRevenueViewStates.earnings')}>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    to="/studio/audience"
                    search={{ tab: 'tiers' }}
                    size="sm"
                    variant="secondary"
                  >
                    {t('studioRevenue.openTiers')}
                  </ButtonLink>
                  <ButtonLink
                    to="/studio/audience"
                    search={{ tab: 'store' }}
                    size="sm"
                    variant="secondary"
                  >
                    {t('studioRevenueViewStates.store')}
                  </ButtonLink>
                </div>
              </StudioPanel>

              {connect && !connect.stripeConfigured ? (
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
              ) : null}

              {fanPayouts ? (
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

              {estimate ? (
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
              ) : null}

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
