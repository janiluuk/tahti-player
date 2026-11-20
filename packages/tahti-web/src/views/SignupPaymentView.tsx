import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, InlineError } from '@tahti-player/ui';

import { fetchMembership, startMembershipCheckout } from '../api/client';
import type { MembershipStatus } from '../api/types';
import { PageBackLink } from '../components/PageBackLink';
import { assignStripeRedirectUrl } from '../lib/stripeRedirect';
import { useAuthStore } from '../stores/authStore';

export function SignupPaymentView() {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    void fetchMembership().then((r) => setMembership(r.data));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {t('signupPaymentView.membership')}
        </h1>
        <p className="text-foreground-secondary text-sm">
          {t('signupPaymentViewBatch33.signInToPurchase')}
        </p>
        <Link
          to="/login"
          className="text-sm underline-offset-2 hover:underline"
        >
          {t('signupPaymentViewBatch33.logIn')}
        </Link>
      </div>
    );
  }

  const isMember = Boolean(membership?.isMember);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {t('signupPaymentView.membership')}
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          {t('signupPaymentView.supportTheTahtiCooperativeAnd')}
        </p>
      </div>

      {isMember ? (
        <div className="border-border rounded-lg border px-4 py-3 text-sm">
          {membership?.memberNumber != null
            ? t('signupPaymentViewBatch33.membershipActiveNumber', {
                number: membership.memberNumber,
              })
            : t('signupPaymentViewBatch33.membershipActive')}
          <div className="mt-2">
            <Link
              to="/settings/$section"
              params={{ section: 'account' }}
              className="underline-offset-2 hover:underline"
            >
              {t('signupPaymentViewBatch33.accountSettings')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-foreground-secondary text-sm">
            {t('signupPaymentView.completeTheSecureCheckoutTo')}
          </p>
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              setMsg(null);
              void startMembershipCheckout({
                successPath: '/signup/payment?membership=success',
                cancelPath: '/signup/payment?membership=canceled',
              }).then((res) => {
                setBusy(false);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                if ('checkoutUrl' in res && res.checkoutUrl) {
                  if (!assignStripeRedirectUrl(res.checkoutUrl)) {
                    setError(i18n.t('web:batch52.checkoutNotStripe'));
                  }
                  return;
                }
                if ('activated' in res && res.activated) {
                  setMsg(
                    res.memberNumber != null
                      ? t('signupPaymentViewBatch33.activatedNumber', {
                          number: res.memberNumber,
                        })
                      : t('signupPaymentViewBatch33.activated'),
                  );
                  void fetchMembership().then((r) => setMembership(r.data));
                }
              });
            }}
          >
            {busy
              ? t('signupPaymentViewStates.starting')
              : t('signupPaymentViewStates.pay40Year')}
          </Button>
        </div>
      )}

      {error && <InlineError>{error}</InlineError>}
      {msg && <p className="text-sm">{msg}</p>}

      <PageBackLink
        to="/settings/$section"
        params={{ section: 'account' }}
        label={t('signupPaymentView.account')}
      />
    </div>
  );
}
