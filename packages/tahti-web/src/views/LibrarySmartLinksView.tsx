import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  FilterChips,
  MediaArtwork,
  Tooltip,
} from '@tahti-player/ui';

import { fetchStudioReleases } from '../api/studio';
import type { StudioRelease } from '../api/studio-types';
import { LibraryFilteredEmpty } from '../components/library/LibraryFilteredEmpty';
import { LibraryItemRow } from '../components/library/LibraryItemRow';
import { LibrarySectionToolbar } from '../components/library/LibrarySectionToolbar';
import { LibrarySortSelect } from '../components/library/LibrarySortSelect';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { StudioGate } from '../components/StudioGate';
import { StudioPanel } from '../components/StudioPanel';
import { sortLibraryItems, type LibrarySort } from '../lib/librarySort';
import { dateLocaleTag } from '../lib/locale';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';

const DSP_LABELS: Record<string, string> = {
  apple: 'Apple Music',
  appleMusic: 'Apple Music',
  bandcamp: 'Bandcamp',
  deezer: 'Deezer',
  mixcloud: 'Mixcloud',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  tidal: 'Tidal',
  youtube: 'YouTube',
  youtubeMusic: 'YouTube Music',
};

function targetLabel(provider: string): string {
  return DSP_LABELS[provider] ?? provider.replace(/[-_]/g, ' ');
}

function releaseTargets(release: StudioRelease): Array<[string, string]> {
  return Object.entries(release.smartLinkTargets ?? {}).filter(([, url]) =>
    Boolean(url),
  );
}

export function LibrarySmartLinksView() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<StudioRelease[]>(
    'library-smart-links',
    async () => apiResult(await fetchStudioReleases()).releases,
  );
  const releases = snapshot.data ?? [];
  const { loading, error: loadError, retry } = snapshot;
  const [query, setQuery] = useState('');
  const [dspFilter, setDspFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<LibrarySort>('newest');

  const dspChips = useMemo(() => {
    const ids = new Set<string>();
    for (const release of releases) {
      for (const [provider] of releaseTargets(release)) {
        ids.add(provider);
      }
    }
    return [
      { id: 'ALL', label: 'All' },
      ...[...ids]
        .sort((a, b) => targetLabel(a).localeCompare(targetLabel(b)))
        .map((id) => ({ id, label: targetLabel(id) })),
    ];
  }, [releases]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = releases.filter((release) => {
      if (
        dspFilter !== 'ALL' &&
        !releaseTargets(release).some(([provider]) => provider === dspFilter)
      ) {
        return false;
      }
      return !needle || release.title.toLowerCase().includes(needle);
    });
    return sortLibraryItems(
      matching,
      sort,
      (release) => release.title,
      (release) => release.releaseDate,
    );
  }, [releases, query, dspFilter, sort]);

  return (
    <StudioGate requireChannel={false} embedded>
      <div className="mt-2 flex flex-col gap-4">
        <ButtonLink className="w-fit" to="/studio/releases" size="sm">
          {t('librarySmartLinksView.newRelease')}
        </ButtonLink>
        <StudioPanel>
          {loading ? (
            <PageLoading label={t('loading.loadingSmartlinks')} />
          ) : loadError && releases.length === 0 ? (
            <PageError
              title={t('loadErrors.couldNotLoadYourSmartlinks')}
              description={loadError}
              onRetry={() => {
                retry();
              }}
            />
          ) : releases.length === 0 ? (
            <PageEmpty
              title={t('empties.noReleasesYet')}
              description={t('empties.createAReleaseToGetIts')}
              action={
                <ButtonLink to="/studio/releases" size="sm" variant="secondary">
                  {t('librarySmartLinksView.createRelease')}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <LibrarySectionToolbar
                className="mb-4"
                query={query}
                onQueryChange={setQuery}
                searchPlaceholder="Search smartlinks…"
                searchLabel="Search smartlinks"
              >
                {dspChips.length > 2 ? (
                  <FilterChips
                    items={dspChips}
                    selected={dspFilter}
                    onChange={setDspFilter}
                    aria-label={t(
                      'librarySmartLinksView.filterSmartlinksByPlatform',
                    )}
                  />
                ) : null}
                {releases.length > 1 ? (
                  <LibrarySortSelect
                    value={sort}
                    onChange={setSort}
                    label={t('librarySmartLinksView.sortSmartlinks')}
                  />
                ) : null}
              </LibrarySectionToolbar>
              {filtered.length === 0 ? (
                <LibraryFilteredEmpty
                  noun="smartlinks"
                  query={query}
                  filtered={dspFilter !== 'ALL'}
                  onClear={() => {
                    setQuery('');
                    setDspFilter('ALL');
                  }}
                />
              ) : (
                <ul className="divide-border divide-y">
                  {filtered.map((release) => {
                    const targets = releaseTargets(release);
                    return (
                      <li key={release.id}>
                        <LibraryItemRow
                          artwork={
                            <MediaArtwork
                              size="thumb"
                              src={release.artworkUrl}
                              alt=""
                              seed={release.id}
                              className="border-border rounded-md border"
                            />
                          }
                          title={
                            <Link
                              to="/studio/releases/$id"
                              params={{ id: release.id }}
                              className="font-medium hover:underline"
                            >
                              {release.title}
                            </Link>
                          }
                          subtitle={
                            <>
                              {release.type} · {release.state}
                              {typeof release._count?.tracks === 'number'
                                ? ` · ${release._count.tracks} track${release._count.tracks === 1 ? '' : 's'}`
                                : ''}
                            </>
                          }
                          meta={
                            <>
                              {targets.length > 0
                                ? `${targets.length} DSP link${targets.length === 1 ? '' : 's'}: ${targets.map(([provider]) => targetLabel(provider)).join(', ')}`
                                : 'No DSP links added yet'}
                              {typeof release.smartLinkViewCount === 'number'
                                ? ` · ${release.smartLinkViewCount.toLocaleString(dateLocaleTag())} views`
                                : ''}
                            </>
                          }
                          actions={
                            <>
                              <ButtonLink
                                to="/studio/releases/$id"
                                params={{ id: release.id }}
                                size="sm"
                                variant="secondary"
                              >
                                {t('librarySmartLinksView.manage')}
                              </ButtonLink>
                              <Tooltip
                                content={t(
                                  'librarySmartLinksView.openSmartlink',
                                )}
                                side="top"
                              >
                                <ButtonLink
                                  to="/r/$slug"
                                  params={{ slug: release.smartLinkSlug }}
                                  size="sm"
                                  variant="text"
                                  aria-label={t(
                                    'librarySmartLinksViewLabels.openSmartlinkForTitle',
                                    { title: release.title },
                                  )}
                                >
                                  <ExternalLinkIcon size={15} aria-hidden />
                                </ButtonLink>
                              </Tooltip>
                            </>
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </StudioPanel>
      </div>
    </StudioGate>
  );
}
