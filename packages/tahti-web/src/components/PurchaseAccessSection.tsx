import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Select, Tooltip } from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
  const [tiers, setTiers] = useState<PurchaseTierRow[]>([]);
  const [tiersFailed, setTiersFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchMyPurchaseTiers().then((result) => {
      setTiers(result.data);
      setTiersFailed(
        result.meta?.source === 'api' && Boolean(result.meta.reason),
      );
    });
  }, [attempt]);

  const activeTiers = tiers.filter((t) => t.active);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {t('purchaseAccess.whoCanPlayIt')}
          </p>
          <p className="text-foreground-secondary text-xs">
            {t('purchaseAccess.limitItToYourFan')}
          </p>
        </div>
        <Tooltip content={t('purchaseAccess.managePurchaseTiers')} side="top">
          <ButtonLink
            to="/studio/audience"
            size="icon-sm"
            variant="secondary"
            aria-label={t('purchaseAccess.managePurchaseTiers')}
          >
            <PlusIcon size={15} aria-hidden />
          </ButtonLink>
        </Tooltip>
      </div>
      <div className="sm:max-w-xs">
        <Select
          label={t('purchaseAccess.access')}
          options={[
            { id: '', label: t('purchaseAccessSectionFields.everyone') },
            {
              id: SUBSCRIBERS_OPTION,
              label: t('purchaseAccessSectionFields.fanSubscribersOnly'),
            },
            ...activeTiers.map((t) => ({
              id: t.id,
              label: `${t.name} — ${t.priceOptional ? `pay what you want, suggested ${euros(t.priceCents)}` : euros(t.priceCents)}`,
            })),
          ]}
          value={optionFromAccess(access)}
          onValueChange={(value) => onAccessChange(accessFromOption(value))}
        />
      </div>
      {tiersFailed && tiers.length === 0 ? (
        <div
          role="alert"
          className="text-accent-red-strong flex flex-wrap items-center gap-2 text-xs"
        >
          {t('purchaseAccess.couldNotLoadYourPurchase')}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            {t('purchaseAccess.retry')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
