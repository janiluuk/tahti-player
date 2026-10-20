import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, Link2Icon, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  ButtonLink,
  EmptyState,
  FilterChips,
  ImageReveal,
  Input,
} from '@tahti-player/ui';

import { fetchStudioReleases } from '../api/studio';
import type { StudioRelease } from '../api/studio-types';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { StudioGate } from '../components/StudioGate';
import { StudioPanel } from '../components/StudioPanel';

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
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [dspFilter, setDspFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    void fetchStudioReleases().then((result) => {
      if (cancelled) {
        return;
      }
      setReleases(result.data.releases);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

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
    return releases.filter((release) => {
      if (
        dspFilter !== 'ALL' &&
        !releaseTargets(release).some(([provider]) => provider === dspFilter)
      ) {
        return false;
      }
      return !needle || release.title.toLowerCase().includes(needle);
    });
  }, [releases, query, dspFilter]);

  return (
    <StudioGate requireChannel={false} embedded>
      <div className="mt-2 flex flex-col gap-4">
        <ButtonLink className="w-fit" to="/studio/releases" size="sm">
          New release
        </ButtonLink>
        <StudioPanel>
          {loading ? (
            <PageLoading label="Loading smartlinks…" />
          ) : loadError && releases.length === 0 ? (
            <PageError
              title="Could not load your smartlinks"
              description={loadError}
              onRetry={() => {
                setLoading(true);
                setAttempt((n) => n + 1);
              }}
            />
          ) : releases.length === 0 ? (
            <EmptyState
              size="sm"
              icon={
                <Link2Icon
                  size={28}
                  className="text-foreground-secondary"
                  aria-hidden
                />
              }
              title="No releases yet"
              description="Create a release to get its public smartlink page."
              action={
                <ButtonLink to="/studio/releases" size="sm">
                  Create release
                </ButtonLink>
              }
            />
          ) : (
            <>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search smartlinks…"
                aria-label="Search smartlinks"
                className="mb-4 max-w-md"
                startAddon={
                  <SearchIcon size={14} aria-hidden className="opacity-70" />
                }
              />
              {dspChips.length > 2 ? (
                <FilterChips
                  items={dspChips}
                  selected={dspFilter}
                  onChange={setDspFilter}
                  aria-label="Filter smartlinks by platform"
                  className="mb-4"
                />
              ) : null}
              {filtered.length === 0 ? (
                <PageEmpty
                  title={
                    query.trim()
                      ? `No smartlinks match “${query.trim()}”`
                      : 'No smartlinks match this filter'
                  }
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setQuery('');
                        setDspFilter('ALL');
                      }}
                    >
                      {dspFilter !== 'ALL' ? 'Clear filters' : 'Clear search'}
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-border divide-y">
                  {filtered.map((release) => {
                    const targets = releaseTargets(release);
                    return (
                      <li
                        key={release.id}
                        className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <ImageReveal
                            src={release.artworkUrl ?? undefined}
                            alt=""
                            className="border-border bg-background-secondary size-12 shrink-0 rounded-md border"
                            placeholder={
                              <Link2Icon
                                size={18}
                                className="text-foreground-secondary"
                                aria-hidden
                              />
                            }
                          />
                          <div className="min-w-0">
                            <Link
                              to="/studio/releases/$id"
                              params={{ id: release.id }}
                              className="font-medium hover:underline"
                            >
                              {release.title}
                            </Link>
                            <p className="text-foreground-secondary text-xs">
                              {release.type} · {release.state}
                              {typeof release._count?.tracks === 'number'
                                ? ` · ${release._count.tracks} track${release._count.tracks === 1 ? '' : 's'}`
                                : ''}
                            </p>
                            <p className="text-foreground-secondary mt-1 text-xs">
                              {targets.length > 0
                                ? `${targets.length} DSP link${targets.length === 1 ? '' : 's'}: ${targets.map(([provider]) => targetLabel(provider)).join(', ')}`
                                : 'No DSP links added yet'}
                              {typeof release.smartLinkViewCount === 'number'
                                ? ` · ${release.smartLinkViewCount.toLocaleString()} views`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink
                            to="/studio/releases/$id"
                            params={{ id: release.id }}
                            size="sm"
                            variant="secondary"
                          >
                            Manage
                          </ButtonLink>
                          <ButtonLink
                            to="/r/$slug"
                            params={{ slug: release.smartLinkSlug }}
                            size="sm"
                            variant="text"
                            aria-label={`Open smartlink for ${release.title}`}
                            title="Open smartlink"
                          >
                            <ExternalLinkIcon size={15} aria-hidden />
                          </ButtonLink>
                        </div>
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
