import { useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Alert, Badge, Box, Button, InlineError } from '@tahti-player/ui';

import {
  resendVerificationEmail,
  startMembershipCheckout,
  startMembershipPortal,
} from '../api/client';
import type { MembershipStatus } from '../api/types';
import { membershipStatusLabel } from '../lib/membershipStatus';
import { assignStripeRedirectUrl } from '../lib/stripeRedirect';
import { ListingDate } from './ListingDate';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/**
 * Ported from the studio dashboard's MembershipPanel
 * (apps/web/src/app/dashboard/membership-panel.tsx) — same states and
 * actions (pay, manage billing, resend verification), rebuilt on
 * tahti-web's own API client and design system rather than Next.js server
 * actions. Replaces the read-only membership `<dl>` that used to sit in
 * AccountView's Membership tab.
 */
export function MembershipStatusPanel({
  membership,
  userEmail,
  onChange,
}: {
  membership: MembershipStatus;
  userEmail: string;
  onChange: () => void;
}) {
  const { t } = useTranslation('web');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  function pay() {
    setError(null);
    setMessage(null);
    setBusy(true);
    void startMembershipCheckout({
      successPath: '/settings/account?membership=success',
      cancelPath: '/settings/account?membership=canceled',
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
        setMessage(
          res.memberNumber != null
            ? `Membership activated — member #${res.memberNumber}`
            : 'Membership activated',
        );
        onChange();
      }
    });
  }

  function openPortal() {
    setError(null);
    setBusy(true);
    void startMembershipPortal().then((res) => {
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!assignStripeRedirectUrl(res.portalUrl)) {
        setError(i18n.t('web:batch52.billingNotStripe'));
      }
    });
  }

  function resend() {
    setResendBusy(true);
    setResendMessage(null);
    void resendVerificationEmail(userEmail).then((res) => {
      setResendBusy(false);
      setResendMessage(res.ok ? res.message : res.error);
    });
  }

  if (membership.isMember) {
    const renewalDueAt = membership.renewalDueAt;

    return (
      <Box variant="tertiary" className="flex-col items-start gap-3">
        <Badge variant="pill" color="green">
          Active member #{membership.memberNumber ?? '—'}
        </Badge>
        <p className="text-foreground-secondary text-sm">
          {t('membershipStatus.thankYouForSupportingThe')}
        </p>
        {membership.subscriptionMigrationRequired && (
          <Alert tone="warning" className="text-foreground">
            {t('membershipStatus.yourMembershipUsesTheLegacy')}
          </Alert>
        )}
        {renewalDueAt &&
          !membership.hasStripeSubscription &&
          !membership.subscriptionMigrationRequired && (
            <p className="text-foreground-secondary text-sm">
              {t('membershipStatus.renewalDueAround')}{' '}
              <ListingDate value={renewalDueAt} />. Pay again from this panel
              when reminded, or subscribe via Stripe on your next checkout.
            </p>
          )}
        {membership.hasStripeSubscription && renewalDueAt && (
          <p className="text-foreground-secondary text-sm">
            {t('membershipStatus.nextRenewalAround')}{' '}
            <ListingDate value={renewalDueAt} /> (Stripe subscription).
          </p>
        )}
        {error && <InlineError>{error}</InlineError>}
        {membership.hasStripeSubscription ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={openPortal}
          >
            {busy
              ? t('membershipStatusPanelStates.opening')
              : t('membershipStatusPanelStates.manageBilling')}
          </Button>
        ) : membership.subscriptionMigrationRequired ? (
          <Button size="sm" disabled={busy} onClick={pay}>
            {busy
              ? 'Processing…'
              : `Subscribe for auto-renewal (${euros(membership.priceCents ?? 0)}/year)`}
          </Button>
        ) : null}
      </Box>
    );
  }

  const lapsed = membership.status === 'SUSPENDED';
  const pendingEmail = membership.status === 'PENDING_EMAIL';

  return (
    <Box variant="warning" className="flex-col items-start gap-3">
      <div>
        <h3 className="font-display font-bold">
          {lapsed
            ? t('membershipStatusPanelStates.renewYourMembership')
            : t('membershipStatusPanelStates.completeYourMembership')}
        </h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          Tahti ry is a member-governed nonprofit. Annual membership is{' '}
          {euros(membership.priceCents ?? 0)}/year (tax-deductible for eligible
          professionals in Finland). Adds lossless streaming for listeners and
          unlimited live broadcasting.
        </p>
      </div>
      <p className="text-xs font-semibold tracking-wide uppercase">
        {membershipStatusLabel(membership)}
      </p>
      {lapsed && (
        <InlineError announce={false}>
          {t('membershipStatus.yourMembershipLapsedRenewTo')}
        </InlineError>
      )}
      {pendingEmail && (
        <div className="flex flex-col gap-2">
          <InlineError announce={false}>
            {t('membershipStatus.verifyYourEmailBeforeCompleting')}
          </InlineError>
          {resendMessage && <p className="text-sm">{resendMessage}</p>}
          <Button
            size="sm"
            variant="ghost"
            disabled={resendBusy}
            onClick={resend}
          >
            {resendBusy
              ? t('membershipStatusPanelStates.sending')
              : t('membershipStatusPanelStates.resendVerificationEmail')}
          </Button>
        </div>
      )}
      {error && <InlineError>{error}</InlineError>}
      {message && <p className="text-sm">{message}</p>}
      <Button
        disabled={busy || !membership.emailVerified || pendingEmail}
        onClick={pay}
      >
        {busy
          ? 'Processing…'
          : `Pay ${euros(membership.priceCents ?? 0)} / year`}
      </Button>
    </Box>
  );
}
