import { useEffect, useState } from 'react';

import { Badge, Button, Input } from '@tahti-player/ui';

import {
  fetchMemberRegister,
  type MemberRegisterRow,
} from '../../../../api/admin/admin-member-register';
import { PageEmpty } from '../../../../components/PageStates';
import { CollapsibleRecord } from '../tabs/MeetingRecordPanels';

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'red' | 'secondary'> =
  {
    ACTIVE: 'green',
    PAST_DUE: 'yellow',
    PENDING_PAYMENT: 'yellow',
    CANCELLED: 'red',
    EXPIRED: 'red',
  };

function statusLabel(status: string | null): string {
  if (!status) {
    return 'No membership';
  }
  const text = status.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The member register, searchable by name, username or member number.
 * Emails stay in the CSV export; the list shows names only. */
export function MemberRegisterPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MemberRegisterRow[] | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || rows !== null) {
      return;
    }
    void fetchMemberRegister().then((result) => {
      if (!result.ok) {
        setError(result.error);
        setRows([]);
        return;
      }
      setRows(result.data);
    });
  }, [open, rows]);

  const q = query.trim().toLowerCase();
  const shown = (rows ?? []).filter(
    (row) =>
      !q ||
      row.displayName.toLowerCase().includes(q) ||
      row.username.toLowerCase().includes(q) ||
      String(row.memberNumber ?? '') === q,
  );

  return (
    <CollapsibleRecord
      label={`Member register${rows ? ` (${rows.length})` : ''}`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {rows === null ? (
        <p className="text-foreground-secondary text-xs">Loading…</p>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            label="Find a member"
            placeholder="Name, username or member number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {shown.length === 0 ? (
            <PageEmpty
              title="No member matches."
              action={
                q ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuery('')}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-border divide-y text-sm">
              {shown.map((row) => (
                <li
                  key={row.username}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                >
                  <span>
                    <span className="text-foreground-secondary mr-2 text-xs">
                      #{row.memberNumber ?? '—'}
                    </span>
                    <span className="font-medium">{row.displayName}</span>
                    <span className="text-foreground-secondary ml-1.5 text-xs">
                      @{row.username}
                      {row.memberSince
                        ? ` · since ${new Date(row.memberSince).toLocaleDateString()}`
                        : ''}
                    </span>
                  </span>
                  <Badge
                    variant="pill"
                    color={
                      STATUS_COLORS[row.membershipStatus ?? ''] ?? 'secondary'
                    }
                  >
                    {statusLabel(row.membershipStatus)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error ? (
        <p className="text-accent-red-strong mt-2 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </CollapsibleRecord>
  );
}
