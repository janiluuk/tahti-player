import { PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, SaveButton, Select, Tooltip } from '@tahti-player/ui';

import {
  createLedgerEntry,
  isLedgerOutflow,
  LEDGER_CATEGORIES,
  type AdminLedgerEntry,
} from '../../../api/admin';
import { StudioPanel } from '../../../components/StudioPanel';

export function formatEur(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 2 })}`;
}

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ').toLowerCase();
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function currentMonth(now = new Date()): { start: string; end: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return {
    start: isoDate(new Date(Date.UTC(year, month, 1))),
    end: isoDate(new Date(Date.UTC(year, month + 1, 0))),
  };
}

function LedgerEntryForm({ onSaved }: { onSaved: () => void }) {
  const month = currentMonth();
  const [category, setCategory] = useState<string>(LEDGER_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [periodStart, setPeriodStart] = useState(month.start);
  const [periodEnd, setPeriodEnd] = useState(month.end);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border-border mb-4 flex flex-col gap-3 border-b pb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Category"
          value={category}
          onValueChange={setCategory}
          options={LEDGER_CATEGORIES.map((ledgerCategory) => ({
            id: ledgerCategory,
            label: categoryLabel(ledgerCategory),
          }))}
        />
        <Input
          label="Amount (€)"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          description={
            isLedgerOutflow(category)
              ? 'Recorded as a cost.'
              : 'Recorded as income.'
          }
        />
        <Input
          type="date"
          label="Period start"
          value={periodStart}
          onChange={(event) => setPeriodStart(event.target.value)}
        />
        <Input
          type="date"
          label="Period end"
          value={periodEnd}
          onChange={(event) => setPeriodEnd(event.target.value)}
        />
      </div>
      <Input
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Input
        label="Reference (optional)"
        description="Invoice or bank reference."
        value={externalRef}
        onChange={(event) => setExternalRef(event.target.value)}
      />
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <SaveButton
          size="sm"
          disabled={!amount.trim() || !description.trim()}
          saving={saving}
          label="Save entry"
          onClick={() => {
            const eur = Number(amount.replace(',', '.'));
            setSaving(true);
            setError(null);
            void createLedgerEntry({
              category,
              amountCents: Number.isFinite(eur) ? Math.round(eur * 100) : NaN,
              description,
              externalRef,
              periodStart,
              periodEnd,
            }).then((result) => {
              setSaving(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onSaved();
            });
          }}
        />
      </div>
    </div>
  );
}

export function LedgerPanel({
  entries,
  onChanged,
}: {
  entries: AdminLedgerEntry[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <StudioPanel
      title="Ledger entries"
      action={
        <Tooltip content={showForm ? 'Cancel entry' : 'Add entry'} side="top">
          <Button
            size="icon-sm"
            onClick={() => setShowForm((v) => !v)}
            aria-label={showForm ? 'Cancel entry' : 'Add entry'}
          >
            {showForm ? (
              <XIcon size={16} aria-hidden />
            ) : (
              <PlusIcon size={16} aria-hidden />
            )}
          </Button>
        </Tooltip>
      }
    >
      {showForm && (
        <LedgerEntryForm
          onSaved={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      )}

      {entries.length === 0 ? (
        <p className="text-foreground-secondary py-4 text-center text-sm">
          No ledger entries yet.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {entries.map((entry) => {
            const outflow = isLedgerOutflow(entry.category);
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{entry.description}</div>
                  <div className="text-foreground-secondary text-xs">
                    {categoryLabel(entry.category)} ·{' '}
                    {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.externalRef ? ` · ${entry.externalRef}` : ''}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${outflow ? 'text-accent-red-strong' : 'text-accent-green-strong'}`}
                >
                  {outflow ? '−' : '+'}
                  {formatEur(Math.abs(entry.amountCents))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </StudioPanel>
  );
}
