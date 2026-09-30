import { ShoppingBagIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

import {
  checkoutPurchaseTier,
  type PublicStoreTier,
} from '../../api/purchase-tiers';
import { useAuthStore } from '../../stores/authStore';
import { Eyebrow } from '../tahti/Eyebrow';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function StoreTierRow({
  username,
  tier,
  canBuy,
}: {
  username: string;
  tier: PublicStoreTier;
  canBuy: boolean;
}) {
  const signedIn = Boolean(useAuthStore((state) => state.user));
  const [amount, setAmount] = useState((tier.priceCents / 100).toString());
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (!signedIn) {
      toast.error('Sign in to buy');
      return;
    }
    let amountCents: number | undefined;
    if (tier.priceOptional) {
      const parsed = Number(amount.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error('Enter an amount of at least €0.');
        return;
      }
      amountCents = Math.round(parsed * 100);
    }
    setBusy(true);
    const result = await checkoutPurchaseTier(username, tier.id, {
      amountCents,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if ('checkoutUrl' in result) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    toast.success(`Bought ${tier.name}`);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">
          {tier.name}{' '}
          <span className="text-foreground-secondary">
            {tier.priceOptional
              ? `pay what you want (suggested ${euros(tier.priceCents)})`
              : euros(tier.priceCents)}
          </span>
        </p>
        {tier.description ? (
          <p className="text-foreground-secondary text-xs">
            {tier.description}
          </p>
        ) : null}
      </div>
      {canBuy ? (
        <div className="flex items-center gap-2">
          {tier.priceOptional ? (
            <Input
              className="w-20"
              inputMode="decimal"
              value={amount}
              aria-label={`Amount in euros for ${tier.name}`}
              onChange={(event) => setAmount(event.target.value)}
            />
          ) : null}
          <Button
            size="sm"
            disabled={busy}
            aria-label={`Buy ${tier.name}`}
            onClick={() => void buy()}
          >
            <ShoppingBagIcon size={14} aria-hidden className="mr-1.5" />
            Buy
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function ArtistStoreSection({
  username,
  tiers,
  paymentsReady,
  isOwner,
}: {
  username: string;
  tiers: PublicStoreTier[];
  paymentsReady: boolean;
  isOwner: boolean;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label="Store">
      <Eyebrow>Store</Eyebrow>
      {!paymentsReady ? (
        <p className="text-foreground-secondary text-xs">
          {isOwner
            ? 'Finish payouts setup under Studio → Revenue before fans can buy.'
            : 'Purchases open once this artist finishes payouts setup.'}
        </p>
      ) : null}
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {tiers.map((tier) => (
          <StoreTierRow
            key={tier.id}
            username={username}
            tier={tier}
            canBuy={paymentsReady && !isOwner}
          />
        ))}
      </ul>
    </section>
  );
}
