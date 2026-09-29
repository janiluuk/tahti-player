import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, Select, Textarea } from '@tahti-player/ui';

import {
  createAccountRestriction,
  fetchAccountRestrictions,
  isRestrictionActive,
  liftAccountRestriction,
  type AccountRestriction,
  type AccountRestrictionType,
} from '../../api/admin';
import { PageError, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

const TYPE_LABELS: Record<AccountRestrictionType, string> = {
  LOGIN: 'Sign-in',
  UPLOAD: 'Uploads',
  LIVE_SHOW_BOOKING: 'Live show booking',
};

const TYPE_HELP: Record<AccountRestrictionType, string> = {
  LOGIN: 'Blocks signing in.',
  UPLOAD: 'Blocks uploading tracks, sounds and release audio.',
  LIVE_SHOW_BOOKING: 'Blocks scheduling new live shows.',
};

const DURATIONS = [
  { id: '', label: 'Until lifted' },
  { id: '1', label: '1 day' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '365', label: '1 year' },
];

function describeRestriction(restriction: AccountRestriction): string {
  const parts = [
    `Since ${new Date(restriction.bannedAt).toLocaleDateString()}`,
  ];
  if (restriction.liftedAt) {
    parts.push(`lifted ${new Date(restriction.liftedAt).toLocaleDateString()}`);
  } else if (restriction.expiresAt) {
    parts.push(
      `${isRestrictionActive(restriction) ? 'until' : 'expired'} ${new Date(
        restriction.expiresAt,
      ).toLocaleDateString()}`,
    );
  } else {
    parts.push('until lifted');
  }
  if (restriction.bannedByUsername) {
    parts.push(`by @${restriction.bannedByUsername}`);
  }
  return parts.join(' · ');
}

export function AdminUserRestrictionsPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<AccountRestriction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<AccountRestrictionType>('UPLOAD');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAccountRestrictions(userId).then((result) => {
      if (!cancelled) {
        setItems(result.data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => load(), [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    const result = await createAccountRestriction(userId, {
      type,
      reason,
      durationDays: duration ? Number(duration) : null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReason('');
    load();
  };

  const lift = async (restriction: AccountRestriction) => {
    setBusy(true);
    setError(null);
    const result = await liftAccountRestriction(userId, restriction.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    load();
  };

  const active = (items ?? []).filter((item) => isRestrictionActive(item));
  const past = (items ?? []).filter((item) => !isRestrictionActive(item));

  return (
    <StudioPanel
      title="Restrictions"
      description="Block one thing without suspending the whole account. The reason is shown to the user."
    >
      {loading && !items ? (
        <PageLoading label="Loading restrictions…" />
      ) : !items ? (
        <PageError
          title="Couldn't load restrictions"
          onRetry={() => void load()}
        />
      ) : (
        <div className="flex flex-col gap-4" data-testid="admin-restrictions">
          {active.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No active restrictions.
            </p>
          ) : (
            <ul className="divide-border divide-y text-sm">
              {active.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <Badge variant="pill" color="red">
                        {TYPE_LABELS[item.type]}
                      </Badge>
                      <span className="break-words">{item.reason}</span>
                    </span>
                    <span className="text-foreground-secondary text-xs">
                      {describeRestriction(item)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    aria-label={`Lift ${TYPE_LABELS[item.type].toLowerCase()} restriction`}
                    onClick={() => void lift(item)}
                  >
                    Lift
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="border-border flex flex-col gap-3 border-t pt-4"
            aria-label="Add a restriction"
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim() && !busy) {
                void add();
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Restrict"
                value={type}
                onValueChange={(value) =>
                  setType(value as AccountRestrictionType)
                }
                options={(
                  Object.keys(TYPE_LABELS) as AccountRestrictionType[]
                ).map((id) => ({ id, label: TYPE_LABELS[id] }))}
              />
              <Select
                label="For"
                value={duration}
                onValueChange={setDuration}
                options={DURATIONS}
              />
            </div>
            <p className="text-foreground-secondary text-xs">
              {TYPE_HELP[type]}
            </p>
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
                placeholder="Shown to the user"
              />
            </label>
            {error ? (
              <p className="text-accent-red-strong text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={busy || !reason.trim()}>
                Add restriction
              </Button>
            </div>
          </form>

          {past.length > 0 ? (
            <details className="text-sm">
              <summary className="text-foreground-secondary cursor-pointer text-xs uppercase">
                Past restrictions ({past.length})
              </summary>
              <ul className="divide-border mt-2 divide-y">
                {past.map((item) => (
                  <li key={item.id} className="py-2">
                    <span className="block">
                      {TYPE_LABELS[item.type]}: {item.reason}
                    </span>
                    <span className="text-foreground-secondary text-xs">
                      {describeRestriction(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      )}
    </StudioPanel>
  );
}
