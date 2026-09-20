import {
  CircleDollarSignIcon,
  MessageCircleIcon,
  NewspaperIcon,
  PlusIcon,
  SparklesIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Dialog, FilterChips, Input, Textarea } from '@tahti-player/ui';

import {
  createFanTier,
  fetchMyFanTiers,
  setFanTierActive,
  type FanTierRow,
} from '../api/fan-tiers';

const PERK_OPTIONS = [
  {
    key: 'FAN_CHAT',
    label: 'Fan chat',
    icon: <MessageCircleIcon size={14} aria-hidden />,
  },
  {
    key: 'FAN_NEWSLETTER',
    label: 'Fan newsletter',
    icon: <NewspaperIcon size={14} aria-hidden />,
  },
  {
    key: 'EARLY_ACCESS',
    label: 'Early access',
    icon: <SparklesIcon size={14} aria-hidden />,
  },
] as const;

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function FanTiersEditor() {
  const [tiers, setTiers] = useState<FanTierRow[]>([]);
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
        <Button
          size="sm"
          onClick={() => {
            setMsg(null);
            setCreateOpen(true);
          }}
          aria-label="New tier"
          title="New tier"
        >
          <PlusIcon size={16} aria-hidden className="mr-1.5" />
          New tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-lg border px-4 py-6 text-center">
          <p className="text-foreground-secondary text-sm">No tiers yet.</p>
        </div>
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
                    {t.perks.join(', ')}
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
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              label="Price (€ / month)"
              value={eurosAmt}
              onChange={(e) => setEurosAmt(e.target.value)}
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary text-xs uppercase">
                Description
              </span>
              <Textarea
                tone="secondary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </label>
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
