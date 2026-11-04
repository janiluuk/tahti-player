import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  ButtonLink,
  Input,
  MediaArtwork,
  ViewShell,
} from '@tahti-player/ui';

import { fetchPublicGroups, type ArtistGroupSummary } from '../api/groups';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { groupCountLabel } from '../lib/groupPeople';

export function GroupsDirectoryView() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<ArtistGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchPublicGroups({ q: query.trim() || undefined, limit: 50 }).then(
        ({ data, meta }) => {
          if (cancelled) {
            return;
          }
          setGroups(data.items);
          setError(meta.source === 'api' ? (meta.reason ?? null) : null);
          setLoading(false);
        },
      );
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, attempt]);

  const renderList = () => {
    if (loading) {
      return <PageLoading label="Loading groups…" />;
    }
    if (error && groups.length === 0) {
      return (
        <PageError
          title="Could not load groups"
          description={error}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      );
    }
    if (groups.length === 0) {
      return (
        <PageEmpty
          title={query.trim() ? 'No groups match that search' : 'No groups yet'}
          description="Artists can start a group from Studio."
        />
      );
    }
    return (
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Groups">
        {groups.map((group) => (
          <li
            key={group.id}
            className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-xl border p-3"
          >
            <MediaArtwork
              src={group.coverUrl ?? undefined}
              alt=""
              size="md"
              className="rounded-md"
            />
            <div className="min-w-0 flex-1">
              <ButtonLink
                to="/groups/$slug"
                params={{ slug: group.slug }}
                variant="text"
                size="flexible"
                className="h-auto justify-start px-0 text-left font-semibold whitespace-normal hover:underline"
              >
                {group.name}
              </ButtonLink>
              <p className="text-foreground-secondary text-xs">
                {groupCountLabel(group.memberCount, 'member', 'members')} ·{' '}
                {groupCountLabel(group.itemCount, 'sound', 'sounds')}
              </p>
              {group.joinPolicy === 'REQUEST' ? (
                <Badge variant="pill" color="secondary" className="mt-1">
                  Request to join
                </Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-1 py-2">
      <ViewShell
        title="Groups"
        subtitle="Artist collectives with a shared playlist."
        classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
      >
        <div className="relative max-w-md">
          <SearchIcon
            size={16}
            className="text-foreground-secondary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            aria-hidden
          />
          <Input
            aria-label="Search groups"
            placeholder="Search groups"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {renderList()}
      </ViewShell>
    </div>
  );
}
