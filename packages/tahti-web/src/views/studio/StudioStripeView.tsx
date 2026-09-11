import { Link } from '@tanstack/react-router';
import { PlugIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button, ViewShell } from '@tahti-player/ui';

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
        <ViewShell title="Stripe" classes={{ root: 'px-0 pt-0' }}>
          {message ? (
            <p className="text-foreground-secondary text-sm" role="status">
              {message}
            </p>
          ) : null}

          {!ready ? (
            <PageLoading label="Loading Stripe…" />
          ) : !enabled ? (
            <StudioPanel
              title="Stripe is not enabled"
              description="This dashboard is only added to Studio when Stripe is configured on the instance."
            >
              <p className="text-foreground-secondary text-sm">
                Fan-sub orders still appear under Audience. Turn Stripe on to
                connect a payout account and open the Express dashboard.
              </p>
              <Link to="/studio/audience" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Back to Audience
                </Button>
              </Link>
            </StudioPanel>
          ) : (
            <>
              {connect ? (
                <StudioPanel
                  title="Payout account"
                  description="Stripe Connect must be payments-ready before fan-sub orders can reach your bank."
                >
                  <div
                    data-tour-id="stripe-status"
                    data-testid="studio-stripe-dashboard"
                    className="text-foreground-secondary flex flex-wrap gap-2 text-xs"
                  >
                    <StatusPill
                      ok={connect.stripeConfigured}
                      label="Stripe on"
                    />
                    <StatusPill
                      ok={Boolean(connect.accountId)}
                      label="Account connected"
                    />
                    <StatusPill
                      ok={connect.detailsSubmitted}
                      label="Details submitted"
                    />
                    <StatusPill
                      ok={connect.chargesEnabled}
                      label="Charges enabled"
                    />
                    <StatusPill
                      ok={connect.paymentsReady}
                      label="Payments ready"
                    />
                  </div>

                  <div
                    data-tour-id="stripe-actions"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {!connect.paymentsReady ? (
                      <Button
                        size="sm"
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
                        <PlugIcon size={15} aria-hidden className="mr-1.5" />
                        Start / resume onboarding
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
                        Open Stripe Express dashboard
                      </Button>
                    ) : null}
                  </div>
                </StudioPanel>
              ) : null}

              {payouts ? (
                <StudioPanel
                  title="Charges through Stripe"
                  description="The same fan-sub orders as Audience, limited to this payout account."
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
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Order flow and grants live on Audience
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
