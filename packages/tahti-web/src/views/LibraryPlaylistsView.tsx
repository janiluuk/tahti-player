import { Link } from '@tanstack/react-router';
import { ListMusicIcon, PlusIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  Card,
  CardGrid,
  FilterBar,
  SectionShell,
} from '@tahti-player/ui';

import { fetchStudioCollections } from '../api/studio/studio-collections';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';

function collectionStyleIsPlaylist(style: string | undefined): boolean {
  return !style || style === 'PLAYLIST' || style === 'DJ_SET_SERIES';
}

export function LibraryPlaylistsView() {
  const { t } = useTranslation('web');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const username = useAuthStore((s) => s.user?.username ?? null);
  const hydrated = useAuthStore((s) => s.hydrated);
  const favoritePlaylists = useLibraryStore((s) => s.favoritePlaylists);
  const toggleFavoritePlaylist = useLibraryStore(
    (s) => s.toggleFavoritePlaylist,
  );
  const [query, setQuery] = useState('');

  const {
    data: ownRows,
    error,
    loading,
    retry,
  } = useSnapshotFetch(`library-playlists-own:${userId ?? ''}`, async () => {
    if (!userId) {
      return [];
    }
    const result = await fetchStudioCollections();
    return apiResult(result).filter((row) =>
      collectionStyleIsPlaylist(row.style),
    );
  });

  const needle = query.trim().toLowerCase();
  const own = useMemo(() => {
    const rows = ownRows ?? [];
    if (!needle) {
      return rows;
    }
    return rows.filter((row) => row.name.toLowerCase().includes(needle));
  }, [needle, ownRows]);
  const saved = useMemo(() => {
    if (!needle) {
      return favoritePlaylists;
    }
    return favoritePlaylists.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        (row.ownerUsername ?? '').toLowerCase().includes(needle),
    );
  }, [favoritePlaylists, needle]);

  if (hydrated && !userId) {
    return <PageEmpty title={t('library.playlists.signIn')} />;
  }

  const busy = Boolean(userId) && loading && ownRows === null;
  const failed = error !== null && ownRows === null;
  const empty = !busy && !failed && own.length === 0 && saved.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-6" data-testid="library-playlists">
      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('library.playlists.filterPlaceholder')}
        searchLabel={t('library.playlists.filterLabel')}
      />
      {error && ownRows ? (
        <PageErrorBanner
          title={t('pageStates.refreshFailed')}
          description={error}
          onRetry={retry}
        />
      ) : null}
      {busy ? <PageLoading /> : null}
      {failed ? (
        <PageError title={t('library.playlists.loadError')} onRetry={retry} />
      ) : null}
      {empty ? (
        <PageEmpty
          title={t('library.playlists.emptyTitle')}
          description={t('library.playlists.emptyDescription')}
          action={
            userId ? (
              <ButtonLink to="/studio/collections" size="sm">
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
                {t('library.playlists.create')}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : null}
      {!empty && own.length > 0 ? (
        <SectionShell title={t('library.playlists.own')}>
          <CardGrid className="grid-cols-2 sm:grid-cols-[repeat(auto-fill,11.5rem)]">
            {own.map((row) => (
              <Card
                key={row.id}
                surface="neutral"
                src={row.coverUrl ?? placeholderArtworkUrl(row.slug)}
                title={
                  username ? (
                    <Link
                      to="/u/$username/c/$slug"
                      params={{ username, slug: row.slug }}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )
                }
                subtitle={t('library.playlists.itemCount', {
                  count: row.itemCount ?? 0,
                })}
              />
            ))}
          </CardGrid>
        </SectionShell>
      ) : null}
      {!empty && saved.length > 0 ? (
        <SectionShell title={t('library.playlists.saved')}>
          <CardGrid className="grid-cols-2 sm:grid-cols-[repeat(auto-fill,11.5rem)]">
            {saved.map((row) => (
              <Card
                key={row.slug}
                surface="neutral"
                src={row.coverUrl ?? placeholderArtworkUrl(row.slug)}
                title={
                  row.ownerUsername ? (
                    <Link
                      to="/u/$username/c/$slug"
                      params={{
                        username: row.ownerUsername,
                        slug: row.slug,
                      }}
                      className="hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )
                }
                subtitle={
                  row.ownerUsername ? `@${row.ownerUsername}` : undefined
                }
                onFavorite={() => toggleFavoritePlaylist(row)}
                favorited
              />
            ))}
          </CardGrid>
        </SectionShell>
      ) : null}
      {!empty && own.length === 0 && saved.length === 0 && needle ? (
        <PageEmpty
          title={t('library.playlists.noMatchesTitle')}
          description={t('library.playlists.noMatchesDescription')}
          action={
            <ButtonLink to="/studio/collections" size="sm" variant="secondary">
              <ListMusicIcon size={14} aria-hidden className="mr-1.5" />
              {t('library.playlists.create')}
            </ButtonLink>
          }
        />
      ) : null}
    </div>
  );
}
