import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Alert, Button, ClampedText } from '@tahti-player/ui';

import {
  fetchFanTiers,
  fetchMySubscriptions,
  startFanSubscribe,
  type FetchMeta,
} from '../api/client';
import type { FanSubscriptionRow, FanTiersResponse } from '../api/types';
import { CurrentFanSubscriptionCard } from '../components/CurrentFanSubscriptionCard';
import { EntitySocialHeader } from '../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import type { FanCheckoutReturn } from '../lib/fanCheckoutReturn';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { syncDocumentMetadata } from '../lib/seo';
import { assignStripeRedirectUrl } from '../lib/stripeRedirect';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

function formatEur(cents: number) {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}/mo`;
}

function activeSubscriptionTo(
  rows: FanSubscriptionRow[],
  username: string,
): FanSubscriptionRow | null {
  const target = username.toLowerCase();
  return (
    rows.find(
      (row) =>
        row.state === 'ACTIVE' && row.artist.username.toLowerCase() === target,
    ) ?? null
  );
}

export function SubscribeView({
  username,
  checkoutReturn = null,
}: {
  username: string;
  checkoutReturn?: FanCheckoutReturn;
}) {
  const [data, setData] = useState<FanTiersResponse | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [current, setCurrent] = useState<FanSubscriptionRow | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchFanTiers(username).then((res) => {
      if (cancelled) {
        return;
      }
      setData(res.data);
      setMeta(res.meta);
      setLoading(false);
      const name = res.data?.artist.displayName;
      if (name) {
        syncDocumentMetadata(window.location.pathname, {
          title: `Subscribe to ${name} · Tahti`,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const reloadCurrent = () =>
    fetchMySubscriptions().then((res) =>
      setCurrent(activeSubscriptionTo(res.data, username)),
    );

  useEffect(() => {
    if (!user) {
      setCurrent(null);
      return;
    }
    let cancelled = false;
    void fetchMySubscriptions().then((res) => {
      if (!cancelled) {
        setCurrent(activeSubscriptionTo(res.data, username));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, username]);

  if (loading) {
    return <PageLoading label="Loading tiers…" />;
  }

  if (!data) {
    return (
      <PageEmpty
        title="Artist not found"
        description="This artist may have been removed or is not available."
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        to="/u/$username"
        params={{ username }}
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← @{username}
      </Link>

      <EntitySocialHeader
        title={`Subscribe to ${data.artist.displayName}`}
        imageUrl={
          data.artist.avatarUrl ?? placeholderArtworkUrl(data.artist.username)
        }
        roundImage
        subtitle={`@${data.artist.username}`}
        description={
          data.artist.bio ? (
            <ClampedText className="whitespace-pre-wrap">
              {data.artist.bio}
            </ClampedText>
          ) : (
            <p>Support this artist on Tahti with a fan subscription.</p>
          )
        }
        visualizerPreset={resolveArtworkVisualizerPreset(data.artist.username)}
        artworkUrlForVisualizer={data.artist.avatarUrl}
        data-testid="subscribe-social-header"
      />

      {checkoutReturn === 'subscribed' && (
        <Alert tone="success" title="Thanks for subscribing!">
          Your support goes straight to {data.artist.displayName}. It can take a
          moment for the subscription to show up here.
        </Alert>
      )}
      {checkoutReturn === 'canceled' && (
        <Alert tone="neutral" title="Checkout cancelled">
          You haven't been charged. Pick a tier whenever you're ready.
        </Alert>
      )}

      {current ? (
        <CurrentFanSubscriptionCard subscription={current} />
      ) : (
        <>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Subscribe to {data.artist.displayName}
          </h2>

          {!data.paymentsReady && meta?.source !== 'mock' && (
            <p className="text-foreground-secondary text-sm">
              This artist isn't set up to take payments yet, so subscribing
              might not work right now.
            </p>
          )}

          {!user && (
            <div className="border-border bg-background-secondary flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-sm">
              <p className="min-w-0 flex-1 basis-48">
                Log in or join Tahti to subscribe.
              </p>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  onClick={() => useAuthModalStore.getState().open('login')}
                >
                  Log in
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => useAuthModalStore.getState().open('join')}
                >
                  Join
                </Button>
              </div>
            </div>
          )}

          {note && <p className="text-foreground-secondary text-sm">{note}</p>}

          {data.tiers.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No active fan tiers yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="border-border bg-background flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div>
                    <div className="font-display text-lg font-bold">
                      {tier.name}
                    </div>
                    <div className="text-primary-strong text-sm font-semibold">
                      {formatEur(tier.amountCents)}
                    </div>
                  </div>
                  {tier.description && (
                    <p className="text-foreground-secondary text-sm">
                      {tier.description}
                    </p>
                  )}
                  {tier.perks && tier.perks.length > 0 && (
                    <ul className="text-foreground-secondary list-inside list-disc text-xs">
                      {tier.perks.map((perk) => (
                        <li key={perk}>{perk}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    size="sm"
                    disabled={busyTier === tier.id}
                    onClick={() => {
                      if (!user) {
                        useAuthModalStore.getState().open('login');
                        return;
                      }
                      setBusyTier(tier.id);
                      setNote(null);
                      void startFanSubscribe(username, tier.id).then((res) => {
                        setBusyTier(null);
                        if (!res.ok) {
                          setNote(res.error);
                          return;
                        }
                        if ('checkoutUrl' in res) {
                          if (!assignStripeRedirectUrl(res.checkoutUrl)) {
                            setNote('Checkout URL was not from Stripe');
                            return;
                          }
                          setNote('Taking you to checkout…');
                          return;
                        }
                        setNote(res.message);
                        void reloadCurrent();
                      });
                    }}
                  >
                    {busyTier === tier.id ? 'Starting…' : 'Subscribe'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
