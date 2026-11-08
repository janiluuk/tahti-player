import { Link } from '@tanstack/react-router';
import { PlugIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink, ViewShell } from '@tahti-player/ui';

import {
  fetchFanConnectPortal,
  fetchFanConnectStatus,
  fetchFanPayoutStats,
  startFanConnectOnboard,
  type FanConnectStatus,
  type FanPayoutStats,
} from '../../api/revenue';
import { FanSubscriptionStats } from '../../components/FanSubscriptionStats';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { mergeRevenueOrders } from '../../lib/revenueOrders';

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant="pill" color={ok ? 'green' : 'secondary'}>
      {ok ? '✓' : '○'} {label}
    </Badge>
  );
}

export function StudioStripeView() {
  const { t } = useTranslation('web');
  const [connect, setConnect] = useState<FanConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<FanPayoutStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([fetchFanConnectStatus(), fetchFanPayoutStats()]).then(
      ([connectResult, payoutResult]) => {
        setConnect(connectResult.data);
        setPayouts(payoutResult.data);
        setReady(true);
      },
    );
  }, []);

  const enabled = connect?.stripeConfigured === true;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-4 px-1 py-2">
        <ViewShell
          title={t('studioStripe.stripe')}
          classes={{ root: 'px-0 pt-0' }}
        >
          {message ? (
            <p className="text-foreground-secondary text-sm" role="status">
              {message}
            </p>
          ) : null}

          {!ready ? (
            <PageLoading label={t('loading.loadingStripe')} />
          ) : !enabled ? (
            <StudioPanel
              title={t('studioStripe.stripeIsNotEnabled')}
              description={t('studioStripe.thisDashboardIsOnlyAdded')}
            >
              <p className="text-foreground-secondary text-sm">
                {t('studioStripe.fanSubOrdersStillAppear')}
              </p>
              <ButtonLink
                to="/studio/audience"
                size="sm"
                variant="secondary"
                className="mt-3"
              >
                {t('studioStripe.backToAudience')}
              </ButtonLink>
            </StudioPanel>
          ) : (
            <>
              {connect ? (
                <StudioPanel
                  title={t('studioStripe.payoutAccount')}
                  description={t('studioStripe.stripeConnectMustBePayments')}
                >
                  <div
                    data-tour-id="stripe-status"
                    data-testid="studio-stripe-dashboard"
                    className="text-foreground-secondary flex flex-wrap gap-2 text-xs"
                  >
                    <StatusPill
                      ok={connect.stripeConfigured}
                      label={t('studioStripe.stripeOn')}
                    />
                    <StatusPill
                      ok={Boolean(connect.accountId)}
                      label={t('studioStripe.accountConnected')}
                    />
                    <StatusPill
                      ok={connect.detailsSubmitted}
                      label={t('studioStripe.detailsSubmitted')}
                    />
                    <StatusPill
                      ok={connect.chargesEnabled}
                      label={t('studioStripe.chargesEnabled')}
                    />
                    <StatusPill
                      ok={connect.paymentsReady}
                      label={t('studioStripe.paymentsReady')}
                    />
                  </div>

                  <div
                    data-tour-id="stripe-actions"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {!connect.paymentsReady ? (
                      <Button
                        size="sm"
                        className="h-auto min-h-9 py-1.5 text-left whitespace-normal"
                        onClick={() => {
                          void startFanConnectOnboard().then((result) => {
                            if (!result.ok) {
                              setMessage(result.error);
                              return;
                            }
                            if ('mockActivated' in result) {
                              setMessage(result.message);
                              void fetchFanConnectStatus().then((next) => {
                                setConnect(next.data);
                              });
                              return;
                            }
                            window.open(
                              result.url,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          });
                        }}
                      >
                        <PlugIcon
                          size={15}
                          aria-hidden
                          className="mr-1.5 shrink-0"
                        />
                        {t('studioStripe.startResumeOnboarding')}
                      </Button>
                    ) : null}
                    {connect.accountId ? (
                      <Button
                        size="sm"
                        variant={
                          connect.paymentsReady ? undefined : 'secondary'
                        }
                        onClick={() => {
                          void fetchFanConnectPortal().then((result) => {
                            if (!result.ok) {
                              setMessage(result.error);
                              return;
                            }
                            if ('mockActivated' in result) {
                              setMessage(result.message);
                              return;
                            }
                            window.open(
                              result.url,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          });
                        }}
                      >
                        {t('studioStripe.openStripeExpressDashboard')}
                      </Button>
                    ) : null}
                  </div>
                </StudioPanel>
              ) : null}

              {payouts ? (
                <StudioPanel
                  title={t('studioStripe.chargesThroughStripe')}
                  description={t('studioStripe.theSameFanSubOrders')}
                >
                  <div data-tour-id="stripe-charges">
                    <FanSubscriptionStats
                      stats={payouts}
                      orders={mergeRevenueOrders(payouts.recent, [])}
                    />
                  </div>
                </StudioPanel>
              ) : null}

              <p className="text-foreground-secondary text-xs">
                Express dashboard payouts to your bank follow Stripe’s schedule.
                A paid order here means Tahti booked the period.{' '}
                <Link
                  to="/studio/audience"
                  className="text-foreground underline underline-offset-2"
                >
                  {t('studioStripe.orderFlowAndGrantsLive')}
                </Link>
                .
              </p>
            </>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
