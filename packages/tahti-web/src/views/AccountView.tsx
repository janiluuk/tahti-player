import { Link } from '@tanstack/react-router';
import { BadgeCheckIcon, HeartHandshakeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Box, Button, ButtonLink, Tabs, ViewShell } from '@tahti-player/ui';

import { fetchMembership, fetchMySubscriptions } from '../api/client';
import type { FanSubscriptionRow, MembershipStatus } from '../api/types';
import { FanSubscriptionsBillingButton } from '../components/FanSubscriptionsBillingButton';
import { MembershipStatusPanel } from '../components/MembershipStatusPanel';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import {
  fanSubscriptionStatusLabel,
  hasPortalManagedSubscription,
  isCanceledAtPeriodEnd,
} from '../lib/fanSubscriptionStatus';
import { useAuthStore } from '../stores/authStore';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function AccountView() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [subs, setSubs] = useState<FanSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) {
      setMembership(null);
      setMembershipError(null);
      setSubs([]);
      setSubsError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void Promise.all([fetchMembership(), fetchMySubscriptions()]).then(
      ([m, s]) => {
        if (cancelled) {
          return;
        }
        setMembership(m.data);
        const reason = m.meta.source === 'api' ? (m.meta.reason ?? null) : null;
        setMembershipError(reason);
        setSubs(s.data);
        setSubsError(s.meta.source === 'api' ? (s.meta.reason ?? null) : null);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user, attempt]);

  if (!user) {
    return (
      <ViewShell
        title="Account"
        classes={{ root: 'px-0 pt-0 mx-auto max-w-md' }}
      >
        <ButtonLink className="w-fit" to="/login">
          Login
        </ButtonLink>
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title="Account"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ButtonLink
          to="/settings/$section"
          params={{ section: 'account' }}
          size="sm"
          variant="secondary"
        >
          Account settings
        </ButtonLink>
        <Button size="sm" variant="text" onClick={() => void logout()}>
          Log out
        </Button>
      </div>

      {loading && <PageLoading label="Loading account…" />}

      <Box
        variant="tertiary"
        className="h-auto w-auto flex-wrap items-center justify-between gap-3 rounded-xl"
      >
        <div>
          <h2 className="font-display font-bold">Membership and security</h2>
          <p className="text-foreground-secondary text-sm">
            Manage cooperative membership, password recovery, and two-factor
            authentication here in Tahti.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!loading && !membership?.isMember ? (
            <ButtonLink to="/signup/payment" size="sm">
              Become a member
            </ButtonLink>
          ) : null}
          <ButtonLink to="/forgot-password" size="sm" variant="secondary">
            Reset password
          </ButtonLink>
          <ButtonLink
            to="/settings/$section"
            params={{ section: 'account' }}
            size="sm"
            variant="secondary"
          >
            Security
          </ButtonLink>
        </div>
      </Box>

      <Tabs
        listClassName="border-border border-b pb-3"
        panelClassName="pt-2"
        items={[
          {
            id: 'membership',
            label: 'Membership',
            icon: <BadgeCheckIcon size={14} />,
            content:
              membershipError && !membership ? (
                <PageError
                  title="Could not load membership"
                  description={membershipError}
                  onRetry={() => setAttempt((n) => n + 1)}
                />
              ) : !membership ? (
                <p className="text-foreground-secondary text-sm">
                  Membership details are unavailable right now.
                </p>
              ) : (
                <MembershipStatusPanel
                  membership={membership}
                  userEmail={user.email}
                  onChange={() =>
                    void fetchMembership().then((m) => setMembership(m.data))
                  }
                />
              ),
          },
          {
            id: 'subscriptions',
            label: 'Fan subscriptions',
            icon: <HeartHandshakeIcon size={14} />,
            count: subs.length,
            content:
              subsError && subs.length === 0 ? (
                <PageError
                  title="Could not load your fan subscriptions"
                  description={subsError}
                  onRetry={() => setAttempt((n) => n + 1)}
                />
              ) : subs.length === 0 ? (
                <PageEmpty title="No fan subscriptions on this account. Support an artist from their profile." />
              ) : (
                <div className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-2">
                    {subs.map((subscription) => (
                      <li
                        key={subscription.id}
                        className="border-border bg-background-secondary/40 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm"
                      >
                        <div>
                          <Link
                            to="/u/$username"
                            params={{ username: subscription.artist.username }}
                            className="font-medium hover:underline"
                          >
                            {subscription.artist.displayName}
                          </Link>
                          <p className="text-foreground-secondary text-xs">
                            {subscription.tierName},{' '}
                            {euros(subscription.amountCents)}/mo,{' '}
                            {isCanceledAtPeriodEnd(subscription)
                              ? fanSubscriptionStatusLabel(subscription)
                              : `${subscription.state}${
                                  subscription.currentPeriodEnd
                                    ? `, until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                                    : ''
                                }`}
                          </p>
                        </div>
                        <ButtonLink
                          to="/subscribe/$username"
                          params={{ username: subscription.artist.username }}
                          size="sm"
                          variant="text"
                        >
                          Tiers
                        </ButtonLink>
                      </li>
                    ))}
                  </ul>
                  {hasPortalManagedSubscription(subs) ? (
                    <FanSubscriptionsBillingButton />
                  ) : null}
                </div>
              ),
          },
        ]}
      />
    </ViewShell>
  );
}
