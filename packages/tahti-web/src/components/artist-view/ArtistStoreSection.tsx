import { ShoppingBagIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input } from '@tahti-player/ui';

import {
  checkoutPurchaseTier,
  type PublicStoreTier,
} from '../../api/purchase-tiers';
import type { StoreListing } from '../../lib/channelStore';
import { assignStripeRedirectUrl } from '../../lib/stripeRedirect';
import { useAuthStore } from '../../stores/authStore';
import { Eyebrow } from '../tahti/Eyebrow';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function StoreTierRow({
  username,
  tier,
  canBuy,
  listing,
}: {
  username: string;
  tier: PublicStoreTier;
  canBuy: boolean;
  listing?: StoreListing;
}) {
  const signedIn = Boolean(useAuthStore((state) => state.user));
  const [amount, setAmount] = useState((tier.priceCents / 100).toString());
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (!signedIn) {
      toast.error(i18n.t('web:auth.signInToBuy'));
      return;
    }
    let amountCents: number | undefined;
    if (tier.priceOptional) {
      const parsed = Number(amount.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error(i18n.t('web:auth.amountMin'));
        return;
      }
      amountCents = Math.round(parsed * 100);
    }
    setBusy(true);
    const result = await checkoutPurchaseTier(username, tier.id, {
      ...(amountCents !== undefined ? { amountCents } : {}),
      ...(listing ? { trackTitle: listing.title, trackId: listing.id } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if ('checkoutUrl' in result) {
      if (!assignStripeRedirectUrl(result.checkoutUrl)) {
        toast.error(i18n.t('web:toasts.checkoutNotStripe'));
      }
      return;
    }
    toast.success(i18n.t('web:toasts.boughtNamed', { name: tier.name }));
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">
          {listing?.title ?? tier.name}{' '}
          <span className="text-foreground-secondary">
            {listing ? `${tier.name} · ` : ''}
            {tier.priceOptional
              ? i18n.t('web:artistStoreSectionStates.payWhatYouWant', {
                  price: euros(tier.priceCents),
                })
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
              aria-label={i18n.t('web:artistStoreSectionStates.amountFor', {
                name: listing?.title ?? tier.name,
              })}
              onChange={(event) => setAmount(event.target.value)}
            />
          ) : null}
          <Button
            size="sm"
            disabled={busy}
            aria-label={i18n.t('web:artistStoreSectionStates.buyNamed', {
              name: listing?.title ?? tier.name,
            })}
            onClick={() => void buy()}
          >
            <ShoppingBagIcon size={14} aria-hidden className="mr-1.5" />
            {i18n.t('web:artistStoreSectionStates.buy')}
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
  items = [],
}: {
  username: string;
  tiers: PublicStoreTier[];
  paymentsReady: boolean;
  isOwner: boolean;
  items?: StoreListing[];
}) {
  const { t } = useTranslation('web');
  const rows =
    items.length > 0
      ? items.flatMap((listing) => {
          const tier = tiers.find((row) => row.id === listing.tierId);
          return tier ? [{ listing, tier }] : [];
        })
      : tiers.map((tier) => ({ listing: undefined, tier }));
  if (rows.length === 0) {
    return null;
  }
  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('artistStoreSectionText.store')}
    >
      <Eyebrow>{t('artistStoreSectionText.store')}</Eyebrow>
      {!paymentsReady ? (
        <p className="text-foreground-secondary text-xs">
          {isOwner
            ? t('artistStoreSectionStates.ownerPayoutsSetup')
            : t('artistStoreSectionStates.purchasesOpenSoon')}
        </p>
      ) : null}
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {rows.map(({ listing, tier }) => (
          <StoreTierRow
            key={listing?.id ?? tier.id}
            username={username}
            tier={tier}
            listing={listing}
            canBuy={paymentsReady && !isOwner}
          />
        ))}
      </ul>
    </section>
  );
}
