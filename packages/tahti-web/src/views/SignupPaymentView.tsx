import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button } from '@tahti-player/ui';

import { fetchMembership, startMembershipCheckout } from '../api/client';
import type { MembershipStatus } from '../api/types';
import { useAuthStore } from '../stores/authStore';

export function SignupPaymentView() {
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
          Membership
        </h1>
        <p className="text-foreground-secondary text-sm">
          Sign in to purchase Tahti ry membership (€40/year).
        </p>
        <Link
          to="/login"
          className="text-sm underline-offset-2 hover:underline"
        >
          Log in →
        </Link>
      </div>
    );
  }

  const isMember = Boolean(membership?.isMember);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Membership
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Support the Tahti cooperative and unlock FLAC streaming, stash
          storage, and a vote at the AGM.
        </p>
      </div>

      {isMember ? (
        <div className="border-border rounded-lg border px-4 py-3 text-sm">
          Membership is active
          {membership?.memberNumber != null
            ? ` — member #${membership.memberNumber}`
            : ''}
          .
          <div className="mt-2">
            <Link
              to="/settings/$section"
              params={{ section: 'account' }}
              className="underline-offset-2 hover:underline"
            >
              Account settings →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-foreground-secondary text-sm">
            Complete the secure checkout to activate your membership.
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
                  window.location.assign(res.checkoutUrl);
                  return;
                }
                if ('activated' in res && res.activated) {
                  setMsg(
                    res.memberNumber != null
                      ? `Membership activated — member #${res.memberNumber}.`
                      : 'Membership activated.',
                  );
                  void fetchMembership().then((r) => setMembership(r.data));
                }
              });
            }}
          >
            {busy ? 'Starting…' : 'Pay €40 / year'}
          </Button>
        </div>
      )}

      {error && <p className="text-accent-red-strong text-sm">{error}</p>}
      {msg && <p className="text-sm">{msg}</p>}

      <Link
        to="/settings/$section"
        params={{ section: 'account' }}
        className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
      >
        ← Account
      </Link>
    </div>
  );
}
