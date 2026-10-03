import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Select, Tooltip } from '@tahti-player/ui';

import {
  fetchMyPurchaseTiers,
  type PurchaseTierRow,
  type SoundAccess,
} from '../api/purchase-tiers';

const SUBSCRIBERS_OPTION = '__subscribers';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function optionFromAccess(access: SoundAccess): string {
  if (access.accessMode === 'SUBSCRIBERS_ONLY') {
    return SUBSCRIBERS_OPTION;
  }
  return access.accessMode === 'PURCHASE' ? (access.purchaseTierId ?? '') : '';
}

function accessFromOption(option: string): SoundAccess {
  if (option === SUBSCRIBERS_OPTION) {
    return { accessMode: 'SUBSCRIBERS_ONLY', purchaseTierId: null };
  }
  return option
    ? { accessMode: 'PURCHASE', purchaseTierId: option }
    : { accessMode: 'FREE', purchaseTierId: null };
}

/** Gate a track behind any fan subscription or a one-time purchase tier -
 * the sound's single `accessMode`/`purchaseTierId` pair. */
export function PurchaseAccessSection({
  access,
  onAccessChange,
}: {
  access: SoundAccess;
  onAccessChange: (access: SoundAccess) => void;
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
          <p className="text-sm font-medium">Who can play it</p>
          <p className="text-foreground-secondary text-xs">
            Limit it to your fan subscribers, or sell it with a one-time
            purchase tier. Fan subscribers can always play gated tracks.
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
      <div className="sm:max-w-xs">
        <Select
          label="Access"
          options={[
            { id: '', label: 'Everyone' },
            { id: SUBSCRIBERS_OPTION, label: 'Fan subscribers only' },
            ...activeTiers.map((t) => ({
              id: t.id,
              label: `${t.name} — ${t.priceOptional ? `pay what you want, suggested ${euros(t.priceCents)}` : euros(t.priceCents)}`,
            })),
          ]}
          value={optionFromAccess(access)}
          onValueChange={(value) => onAccessChange(accessFromOption(value))}
        />
      </div>
    </div>
  );
}
