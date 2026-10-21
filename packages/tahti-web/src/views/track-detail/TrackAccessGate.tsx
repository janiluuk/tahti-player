import { LockIcon } from 'lucide-react';

import { Button, ButtonLink } from '@tahti-player/ui';

import type { TrackAccessGate as Gate } from '../../api/types';

function priceLabel(cents: number | null | undefined, optional: boolean) {
  if (optional) {
    return 'name your price';
  }
  return cents != null ? `€${(cents / 100).toFixed(2)}` : null;
}

export function TrackAccessGate({
  gate,
  artist,
  signedIn,
  priceCents,
  priceOptional = false,
  buyBusy = false,
  onBuy,
  onSignIn,
}: {
  gate: Gate;
  artist: { username: string; displayName: string };
  signedIn: boolean;
  priceCents?: number | null;
  priceOptional?: boolean;
  buyBusy?: boolean;
  onBuy?: () => void;
  onSignIn: () => void;
}) {
  const purchase = gate.reason === 'PURCHASE';
  const price = purchase ? priceLabel(priceCents, priceOptional) : null;
  const canBuy = purchase && Boolean(gate.tierId) && Boolean(onBuy);
  const subscribeLink = (
    <ButtonLink
      to="/subscribe/$username"
      params={{ username: artist.username }}
      size="sm"
      variant={signedIn && !canBuy ? 'default' : 'secondary'}
    >
      {purchase ? 'Subscribe instead' : 'Subscribe to listen'}
    </ButtonLink>
  );

  return (
    <div
      role="region"
      aria-label={purchase ? 'Buy to listen' : 'Fan subscribers only'}
      data-testid="track-access-gate"
      className="flex flex-col gap-3 rounded-lg bg-black/45 p-5 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 text-base font-semibold">
        <LockIcon size={16} aria-hidden />
        {purchase ? 'Buy to listen' : 'Fan subscribers only'}
      </div>
      <p className="text-sm text-white/75">
        {purchase
          ? `Buy this track${price ? ` (${price})` : ''} or subscribe to ${artist.displayName}'s fan tiers to listen.`
          : `${artist.displayName} shares this track with their fan subscribers.`}
        {signedIn ? '' : ' Sign in to listen if you already have access.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {signedIn ? null : (
          <Button size="sm" variant="default" onClick={onSignIn}>
            Sign in to listen
          </Button>
        )}
        {signedIn && canBuy ? (
          <Button
            size="sm"
            variant="default"
            disabled={buyBusy}
            onClick={onBuy}
          >
            {buyBusy ? 'Buying…' : 'Buy this track'}
          </Button>
        ) : null}
        {subscribeLink}
      </div>
    </div>
  );
}
