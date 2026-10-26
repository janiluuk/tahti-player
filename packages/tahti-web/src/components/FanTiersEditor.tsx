import {
  CircleDollarSignIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlusIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
          Fan subscription tiers, perks, and pricing.
        </p>
        <Tooltip
          content="New tier"
          side="bottom"
          wrapperClassName="inline-flex"
        >
          <Button
            size="sm"
            onClick={() => {
              setMsg(null);
              setCreateOpen(true);
            }}
            aria-label="New tier"
          >
            <PlusIcon size={16} aria-hidden className="mr-1.5" />
            New tier
          </Button>
        </Tooltip>
      </div>

      {loaded && loadError && tiers.length > 0 ? (
        <PageErrorBanner
          title="Could not refresh your fan tiers."
          description={loadError}
          onRetry={reload}
        />
      ) : null}

      {!loaded ? (
        <PageLoading label="Loading tiers…" />
      ) : loadError && tiers.length === 0 ? (
        <PageError
          title="Could not load your fan tiers"
          description={loadError}
          onRetry={reload}
        />
      ) : tiers.length === 0 ? (
        <PageEmpty
          title="No tiers yet"
          description="Add a tier so fans can subscribe to support you."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {tiers.map((t) => (
            <li
              key={t.id}
              className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {t.name}{' '}
                  <span className="text-foreground-secondary">
                    {euros(t.amountCents)}/mo
                  </span>
                  {t.active === false ? (
                    <span className="text-foreground-secondary">
                      {' '}
                      · inactive
                    </span>
                  ) : null}
                </div>
                {t.description && (
                  <p className="text-foreground-secondary text-xs">
                    {t.description}
                  </p>
                )}
                {t.perks && t.perks.length > 0 && (
                  <p className="text-foreground-secondary text-[10px]">
                    {t.perks.map(humanizeFanTierPerk).join(', ')}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void setFanTierActive(t.id, t.active === false).then((r) => {
                    if (!r.ok) {
                      setMsg(r.error);
                      return;
                    }
                    reload();
                  });
                }}
              >
                {t.active === false ? 'Activate' : 'Deactivate'}
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
              New tier
            </span>
          </Dialog.Title>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              autoComplete="off"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              inputMode="decimal"
              label="Price (€ / month)"
              value={eurosAmt}
              onChange={(e) => setEurosAmt(e.target.value)}
            />
            <Textarea
              submitOnModEnter
              label="Description"
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
              aria-label="Perks"
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button type="submit" disabled={busy || !name.trim()}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              {busy ? 'Creating…' : 'Create tier'}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </div>
  );
}
