import { CircleDollarSignIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Dialog, Input, Textarea, Toggle } from '@tahti-player/ui';

import {
  createPurchaseTier,
  fetchMyPurchaseTiers,
  setPurchaseTierActive,
  type PurchaseTierRow,
} from '../api/purchase-tiers';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function PurchaseTiersEditor() {
  const [tiers, setTiers] = useState<PurchaseTierRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('Track');
  const [eurosAmt, setEurosAmt] = useState('5');
  const [description, setDescription] = useState('');
  const [priceOptional, setPriceOptional] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void fetchMyPurchaseTiers().then((r) => {
      setTiers(r.data);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const closeCreate = () => {
    setCreateOpen(false);
    setName('Track');
    setEurosAmt('5');
    setDescription('');
    setPriceOptional(false);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground-secondary text-xs">
          One-time purchase tiers for individual tracks — assign one from a
          track's edit dialog.
        </p>
        <Button
          size="sm"
          onClick={() => {
            setMsg(null);
            setCreateOpen(true);
          }}
          aria-label="New purchase tier"
          title="New purchase tier"
        >
          <PlusIcon size={16} aria-hidden className="mr-1.5" />
          New tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-lg border px-4 py-6 text-center">
          <p className="text-foreground-secondary text-sm">
            No purchase tiers yet.
          </p>
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
                    {t.priceOptional
                      ? `pay what you want (suggested ${euros(t.priceCents)})`
                      : euros(t.priceCents)}
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
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void setPurchaseTierActive(t.id, t.active === false).then(
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
            if (!Number.isFinite(eurosN) || eurosN < 0) {
              setMsg('Enter a price of at least €0.');
              return;
            }
            if (!name.trim() || busy) {
              return;
            }
            setBusy(true);
            setMsg(null);
            void createPurchaseTier({
              name: name.trim(),
              priceCents: Math.round(eurosN * 100),
              description: description.trim() || undefined,
              priceOptional,
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
              New purchase tier
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
              label={priceOptional ? 'Suggested price (€)' : 'Price (€)'}
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
            <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">
                Pay what you want (buyer can enter any amount, incl. free)
              </span>
              <Toggle
                label="Pay what you want"
                checked={priceOptional}
                onChange={setPriceOptional}
              />
            </div>
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
