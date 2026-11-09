import {
  CircleDollarSignIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlusIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilterChips,
  Input,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import {
  createFanTier,
  fetchMyFanTiers,
  setFanTierActive,
  type FanTierRow,
} from '../api/fan-tiers';
import { FAN_TIER_PERK_LABELS, humanizeFanTierPerk } from '../lib/fanTierPerks';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

const PERK_OPTIONS = [
  {
    key: 'FAN_CHAT',
    label: FAN_TIER_PERK_LABELS.FAN_CHAT,
    icon: <MessageCircleIcon size={14} aria-hidden />,
  },
  {
    key: 'FAN_NEWSLETTER',
    label: FAN_TIER_PERK_LABELS.FAN_NEWSLETTER,
    icon: <NewspaperIcon size={14} aria-hidden />,
  },
  {
    key: 'EARLY_ACCESS',
    label: FAN_TIER_PERK_LABELS.EARLY_ACCESS,
    icon: <SparklesIcon size={14} aria-hidden />,
  },
] as const;

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function FanTiersEditor() {
  const { t } = useTranslation('web');
  const [tiers, setTiers] = useState<FanTierRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('Supporter');
  const [eurosAmt, setEurosAmt] = useState('5');
  const [description, setDescription] = useState('');
  const [perks, setPerks] = useState<string[]>(['FAN_CHAT']);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const openCreate = () => {
    setMsg(null);
    setCreateOpen(true);
  };

  const reload = () => {
    void fetchMyFanTiers().then((r) => {
      setTiers(r.data);
      setLoadError(r.meta.source === 'api' ? (r.meta.reason ?? null) : null);
      setLoaded(true);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setName('Supporter');
    setEurosAmt('5');
    setDescription('');
    setPerks(['FAN_CHAT']);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground-secondary text-xs">
          {t('tiers.fanIntro')}
        </p>
        <Tooltip
          content={t('tiers.newTier')}
          side="bottom"
          wrapperClassName="inline-flex"
        >
          <Button
            size="sm"
            onClick={openCreate}
            aria-label={t('tiers.newTier')}
          >
            <PlusIcon size={16} aria-hidden className="mr-1.5" />
            {t('tiers.newTier')}
          </Button>
        </Tooltip>
      </div>

      {loaded && loadError && tiers.length > 0 ? (
        <PageErrorBanner
          title={t('loadErrors.couldNotRefreshYourFanTiers')}
          description={loadError}
          onRetry={reload}
        />
      ) : null}

      {!loaded ? (
        <PageLoading label={t('loading.loadingTiers')} />
      ) : loadError && tiers.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadYourFanTiers')}
          description={loadError}
          onRetry={reload}
        />
      ) : tiers.length === 0 ? (
        <PageEmpty
          title={t('empties.noTiersYet')}
          description={t('empties.addATierSoFansCan')}
          action={
            <Button size="sm" variant="secondary" onClick={openCreate}>
              <PlusIcon size={16} aria-hidden />
              {t('tiers.newTier')}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {tiers.map((tier) => (
            <li
              key={tier.id}
              className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {tier.name}{' '}
                  <span className="text-foreground-secondary">
                    {euros(tier.amountCents)}/mo
                  </span>
                  {tier.active === false ? (
                    <span className="text-foreground-secondary">
                      {' '}
                      · inactive
                    </span>
                  ) : null}
                </div>
                {tier.description && (
                  <p className="text-foreground-secondary text-xs">
                    {tier.description}
                  </p>
                )}
                {tier.perks && tier.perks.length > 0 && (
                  <p className="text-foreground-secondary text-[10px]">
                    {tier.perks.map(humanizeFanTierPerk).join(', ')}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void setFanTierActive(tier.id, tier.active === false).then(
                    (r) => {
                      if (!r.ok) {
                        setMsg(r.error);
                        return;
                      }
                      reload();
                    },
                  );
                }}
              >
                {tier.active === false
                  ? t('fanTiersEditorStates.activate')
                  : t('fanTiersEditorStates.deactivate')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="text-foreground-secondary text-xs">{msg}</p>}

      <Dialog.Root isOpen={createOpen} onClose={closeCreate}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const eurosN = Number(eurosAmt.replace(',', '.'));
            if (!Number.isFinite(eurosN) || eurosN < 1) {
              setMsg('Enter a price of at least €1.');
              return;
            }
            if (!name.trim() || busy) {
              return;
            }
            setBusy(true);
            setMsg(null);
            void createFanTier({
              name: name.trim(),
              amountCents: Math.round(eurosN * 100),
              description: description.trim() || undefined,
              perks,
            }).then((r) => {
              setBusy(false);
              if (!r.ok) {
                setMsg(r.error);
                return;
              }
              setMsg('Tier created.');
              closeCreate();
              reload();
            });
          }}
        >
          <Dialog.Title>
            <span className="inline-flex items-center gap-2">
              <CircleDollarSignIcon size={18} aria-hidden />
              {t('fanTiersEditor.newTier')}
            </span>
          </Dialog.Title>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              autoComplete="off"
              label={t('fanTiersEditor.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              inputMode="decimal"
              label={t('fanTiersEditor.priceMonth')}
              value={eurosAmt}
              onChange={(e) => setEurosAmt(e.target.value)}
            />
            <Textarea
              submitOnModEnter
              label={t('fanTiersEditor.description')}
              tone="secondary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <FilterChips
              multiple
              items={PERK_OPTIONS.map((p) => ({
                id: p.key,
                label: p.label,
                icon: p.icon,
              }))}
              selected={perks}
              onChange={setPerks}
              aria-label={t('fanTiersEditor.perks')}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('fanTiersEditor.cancel')}</Dialog.Close>
            <Button type="submit" disabled={busy || !name.trim()}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              {busy
                ? t('fanTiersEditorStates.creating')
                : t('fanTiersEditorStates.createTier')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </div>
  );
}
