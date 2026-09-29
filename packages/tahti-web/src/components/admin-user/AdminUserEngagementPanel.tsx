import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Select, Textarea } from '@tahti-player/ui';

import {
  createEngagementAdjustment,
  fetchAdminUserEngagement,
  type AdminUserEngagement,
} from '../../api/admin';
import { PageError, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

const FIRST_YEAR = 2020;

function formatUnits(units: number): string {
  return units > 0 ? `+${units}` : String(units);
}

function AdjustmentForm({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved: () => void;
}) {
  const [units, setUnits] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = Number(units);
  const valid =
    units.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed !== 0 &&
    reason.trim().length > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await createEngagementAdjustment({
      userId,
      units: parsed,
      reason,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUnits('');
    setReason('');
    onSaved();
  };

  return (
    <form
      className="border-border flex flex-col gap-3 border-t pt-4"
      aria-label="Add an adjustment"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !busy) {
          void submit();
        }
      }}
    >
      <Input
        label="Units"
        inputMode="numeric"
        value={units}
        onChange={(event) => setUnits(event.target.value)}
        placeholder="e.g. 25 or -10"
      />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-foreground-secondary text-xs uppercase">
          Reason
        </span>
        <Textarea
          tone="secondary"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Shown in the audit log"
        />
      </label>
      {error ? (
        <p className="text-accent-red-strong text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!valid || busy}>
          {busy ? 'Adding…' : 'Add adjustment'}
        </Button>
      </div>
    </form>
  );
}

export function AdminUserEngagementPanel({
  userId,
  refreshKey = 0,
}: {
  userId: string;
  refreshKey?: number;
}) {
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<AdminUserEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void fetchAdminUserEngagement(userId, year).then((result) => {
      if (cancelled) {
        return;
      }
      setData(result.data);
      setFailed(!result.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, year]);

  useEffect(() => load(), [load, refreshKey]);

  const years = Array.from(
    { length: currentYear - FIRST_YEAR + 1 },
    (_, index) => currentYear - index,
  );

  return (
    <StudioPanel
      title="Engagement"
      description="Units count toward the yearly grant split. Board adjustments are included in the total and audited."
      action={
        <Select
          label="Year"
          value={String(year)}
          onValueChange={(value) => setYear(Number(value))}
          options={years.map((value) => ({
            id: String(value),
            label: String(value),
          }))}
        />
      }
    >
      {loading ? (
        <PageLoading label="Loading engagement…" />
      ) : failed || !data ? (
        <PageError
          title="Couldn't load engagement"
          onRetry={() => void load()}
        />
      ) : (
        <div className="flex flex-col gap-4" data-testid="admin-engagement">
          <div>
            <p className="font-display text-3xl font-bold">{data.totalUnits}</p>
            <p className="text-foreground-secondary text-xs">
              units in {data.year}
            </p>
          </div>
          {data.adjustments.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No adjustments in {data.year}.
            </p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {data.adjustments.map((entry) => (
                <li
                  key={`${entry.createdAt}-${entry.actorId}-${entry.units}`}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block break-words">{entry.reason}</span>
                    <span className="text-foreground-secondary text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatUnits(entry.units)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.year === currentYear ? (
            <AdjustmentForm userId={userId} onSaved={() => void load()} />
          ) : null}
        </div>
      )}
    </StudioPanel>
  );
}
