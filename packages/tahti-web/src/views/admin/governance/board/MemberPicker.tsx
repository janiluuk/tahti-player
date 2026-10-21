import { useEffect, useState } from 'react';

import { Button, Input } from '@tahti-player/ui';

import { fetchAdminUsers, type AdminUserRow } from '../../../../api/admin';

export type PickedMember = {
  id: string;
  displayName: string;
  username: string;
};

const SEARCH_DELAY_MS = 250;

/** Search the association's members by name or username and pick one. Shows
 * names and usernames only, never email addresses. */
export function MemberPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PickedMember | null;
  onChange: (member: PickedMember | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminUserRow[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchAdminUsers({ q, isMember: 'true' }).then((result) => {
        if (!cancelled) {
          setResults(result.data.filter((user) => user.isMember).slice(0, 6));
        }
      });
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-foreground-secondary text-xs">{label}:</span>
        <span className="font-medium">{value.displayName}</span>
        <span className="text-foreground-secondary text-xs">
          @{value.username}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(null)}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Input
        label={label}
        placeholder="Search members by name or username"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 ? (
        <ul aria-label="Matching members" className="flex flex-col gap-1">
          {results.map((user) => (
            <li key={user.id}>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  onChange({
                    id: user.id,
                    displayName: user.displayName,
                    username: user.username,
                  });
                  setQuery('');
                }}
              >
                {user.displayName} @{user.username}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
