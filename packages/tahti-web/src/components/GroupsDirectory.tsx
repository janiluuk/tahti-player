import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, ButtonLink, Input, MediaArtwork } from '@tahti-player/ui';

import { fetchPublicGroups, type ArtistGroupSummary } from '../api/groups';
import { groupMembersLabel, groupSoundsLabel } from '../lib/groupPeople';
import { PageEmpty, PageError, PageLoading } from './PageStates';

export function GroupsDirectory() {
  const { t } = useTranslation('web');
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<ArtistGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      return <PageLoading label={t('studioGroups.loading')} />;
    }
    if (error && groups.length === 0) {
      return (
        <PageError
          title={t('studioGroups.loadError')}
          description={error}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      );
    }
    if (groups.length === 0) {
      return (
        <PageEmpty
          title={
            query.trim()
              ? t('studioGroups.searchEmpty')
              : t('studioGroups.emptyTitle')
          }
          description={t('studioGroups.directoryEmptyDescription')}
        />
      );
    }
    return (
      <ul
        className="grid gap-3 sm:grid-cols-2"
        aria-label={t('studioGroups.title')}
      >
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
                {groupMembersLabel(group.memberCount, t)} ·{' '}
                {groupSoundsLabel(group.itemCount, t)}
              </p>
              {group.joinPolicy === 'REQUEST' ? (
                <Badge variant="pill" color="secondary" className="mt-1">
                  {t('studioGroups.joinRequest')}
                </Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="discover-groups">
      <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3 sm:p-4">
        <Input
          enterKeyHint="search"
          label={t('studioGroups.searchLabel')}
          placeholder={t('discover.groupsSearchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {renderList()}
    </div>
  );
}
