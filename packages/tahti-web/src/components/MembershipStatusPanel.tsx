import { useState } from 'react';

import { Badge, Box, Button } from '@tahti-player/ui';

import {
  resendVerificationEmail,
  startMembershipCheckout,
  startMembershipPortal,
} from '../api/client';
import type { MembershipStatus } from '../api/types';
import { membershipStatusLabel } from '../lib/membershipStatus';

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
        window.location.assign(res.checkoutUrl);
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
      window.location.assign(res.portalUrl);
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
    const dueLabel = membership.renewalDueAt
      ? new Date(membership.renewalDueAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;

    return (
      <Box variant="tertiary" className="flex-col items-start gap-3">
        <Badge variant="pill" color="green">
          Active member #{membership.memberNumber ?? '—'}
        </Badge>
        <p className="text-foreground-secondary text-sm">
          Thank you for supporting the cooperative — your membership includes
          lossless streaming for listeners and unlimited live broadcasting.
        </p>
        {membership.subscriptionMigrationRequired && (
          <p className="border-accent-yellow/40 bg-accent-yellow/10 text-foreground rounded-lg border px-3 py-2 text-sm">
            Your membership uses the legacy one-time path. Subscribe via Stripe
            for automatic annual renewal and billing receipts.
          </p>
        )}
        {dueLabel &&
          !membership.hasStripeSubscription &&
          !membership.subscriptionMigrationRequired && (
            <p className="text-foreground-secondary text-sm">
              Renewal due around {dueLabel}. Pay again from this panel when
              reminded, or subscribe via Stripe on your next checkout.
            </p>
          )}
        {membership.hasStripeSubscription && dueLabel && (
          <p className="text-foreground-secondary text-sm">
            Next renewal around {dueLabel} (Stripe subscription).
          </p>
        )}
        {error && <p className="text-accent-red-strong text-sm">{error}</p>}
        {membership.hasStripeSubscription ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={openPortal}
          >
            {busy ? 'Opening…' : 'Manage billing →'}
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
          {lapsed ? 'Renew your membership' : 'Complete your membership'}
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
        <p className="text-accent-red-strong text-sm">
          Your membership lapsed — renew to restore lossless streaming and
          unlimited live time.
        </p>
      )}
      {pendingEmail && (
        <div className="flex flex-col gap-2">
          <p className="text-accent-red-strong text-sm">
            Verify your email before completing membership checkout.
          </p>
          {resendMessage && <p className="text-sm">{resendMessage}</p>}
          <Button
            size="sm"
            variant="ghost"
            disabled={resendBusy}
            onClick={resend}
          >
            {resendBusy ? 'Sending…' : 'Resend verification email'}
          </Button>
        </div>
      )}
      {error && <p className="text-accent-red-strong text-sm">{error}</p>}
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
