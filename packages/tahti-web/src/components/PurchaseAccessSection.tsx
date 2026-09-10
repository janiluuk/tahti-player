import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Select, Tooltip } from '@tahti-player/ui';

import {
  fetchMyPurchaseTiers,
  type PurchaseTierRow,
} from '../api/purchase-tiers';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** Gate a track behind a one-time purchase tier — a separate control from
 * `AudienceVisibilitySection`'s fan-subscription gating, since purchase
 * access is its own `accessMode`/`purchaseTierId` pair on the sound. */
export function PurchaseAccessSection({
  purchaseTierId,
  onPurchaseTierIdChange,
}: {
  purchaseTierId: string | null;
  onPurchaseTierIdChange: (purchaseTierId: string | null) => void;
}) {
  const [tiers, setTiers] = useState<PurchaseTierRow[]>([]);

  useEffect(() => {
    void fetchMyPurchaseTiers().then((result) => setTiers(result.data));
  }, []);

  const activeTiers = tiers.filter((t) => t.active);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Sell this track</p>
          <p className="text-foreground-secondary text-xs">
            Gate it behind a one-time purchase tier instead of (or as well as)
            fan subscriptions.
          </p>
        </div>
        <Link to="/studio/audience">
          <Tooltip content="Manage purchase tiers" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label="Manage purchase tiers"
            >
              <PlusIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </Link>
      </div>
      <Select
        label="Purchase tier"
        options={[
          { id: '', label: 'No purchase gate' },
          ...activeTiers.map((t) => ({
            id: t.id,
            label: `${t.name} — ${t.priceOptional ? `pay what you want, suggested ${euros(t.priceCents)}` : euros(t.priceCents)}`,
          })),
        ]}
        value={purchaseTierId ?? ''}
        onValueChange={(value) => onPurchaseTierIdChange(value || null)}
      />
    </div>
  );
}
