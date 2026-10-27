import { useEffect, useMemo, useState } from 'react';

import { Button, FilterChips } from '@tahti-player/ui';

import type { IntegrationId } from '../api/sources';
import { fetchStudioSounds } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { EmbedTrackRow } from '../components/EmbedTrackRow';
import { LibrarySectionToolbar } from '../components/library/LibrarySectionToolbar';
import { LibrarySortSelect } from '../components/library/LibrarySortSelect';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { SoundCloudEmbedsPanel } from '../components/SoundCloudEmbedsPanel';
import { SourceServiceIcon } from '../components/SourceServiceIcon';
import { EMBED_PROVIDER_LABEL, type EmbedProvider } from '../lib/embedSrc';
import { sortLibraryItems, type LibrarySort } from '../lib/librarySort';

const PROVIDER_SOURCE_ICON_ID: Record<EmbedProvider, IntegrationId> = {
  HEARTHIS: 'hearthis',
  MIXCLOUD: 'mixcloud',
  SPOTIFY: 'spotify',
  BANDCAMP: 'bandcamp',
  MIKSERI: 'mikseri',
};

type EmbedItem = StudioSound & {
  embedProvider: EmbedProvider;
  embedUri: string;
};

const isEmbedItem = (item: StudioSound): item is EmbedItem =>
  Boolean(item.embedProvider && item.embedUri);

/** Imported tracks Tahti only references (hearthis.at/Mixcloud/Spotify/
 * Bandcamp), grouped by provider so each section plays through that
 * provider's own embedded widget (EmbedTrackRow) — never mixed in with
 * Tahti-hosted audio in the regular Tracks list. */
export function LibraryEmbedsView() {
  const [items, setItems] = useState<StudioSound[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<LibrarySort>('newest');

  useEffect(() => {
    let cancelled = false;
    void fetchStudioSounds().then((result) => {
      if (!cancelled) {
        setLoadError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
        setItems(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const groups = useMemo(() => {
    const byProvider = new Map<EmbedProvider, EmbedItem[]>();
    for (const item of items ?? []) {
      if (!isEmbedItem(item)) {
        continue;
      }
      if (providerFilter !== 'ALL' && item.embedProvider !== providerFilter) {
        continue;
      }
      const list = byProvider.get(item.embedProvider) ?? [];
      list.push(item);
      byProvider.set(item.embedProvider, list);
    }
    return [...byProvider.entries()]
      .sort(([a], [b]) =>
        EMBED_PROVIDER_LABEL[a].localeCompare(EMBED_PROVIDER_LABEL[b]),
      )
      .map(
        ([provider, list]) =>
          [
            provider,
            sortLibraryItems(
              list,
              sort,
              (item) => item.title,
              (item) => item.createdAt,
            ),
          ] as [EmbedProvider, EmbedItem[]],
      );
  }, [items, providerFilter, sort]);

  const providerChips = useMemo(() => {
    const ids = new Set<EmbedProvider>();
    for (const item of items ?? []) {
      if (isEmbedItem(item)) {
        ids.add(item.embedProvider);
      }
    }
    return [
      { id: 'ALL', label: 'All' },
      ...[...ids]
        .sort((a, b) =>
          EMBED_PROVIDER_LABEL[a].localeCompare(EMBED_PROVIDER_LABEL[b]),
        )
        .map((id) => ({ id, label: EMBED_PROVIDER_LABEL[id] })),
    ];
  }, [items]);

  if (items === null) {
    return <PageLoading label="Loading embeds…" />;
  }

  const hasAnyEmbeds = (items ?? []).some(isEmbedItem);

  return (
    <div className="flex flex-col gap-8">
      <SoundCloudEmbedsPanel />
      {hasAnyEmbeds ? (
        <LibrarySectionToolbar>
          {providerChips.length > 2 ? (
            <FilterChips
              items={providerChips}
              selected={providerFilter}
              onChange={setProviderFilter}
              aria-label="Filter embeds by provider"
            />
          ) : null}
          <LibrarySortSelect
            value={sort}
            onChange={setSort}
            label="Sort embeds"
          />
        </LibrarySectionToolbar>
      ) : null}
      {loadError ? (
        <PageError
          title="Could not load your imported embeds"
          description={loadError}
          onRetry={() => {
            setItems(null);
            setAttempt((n) => n + 1);
          }}
        />
      ) : null}
      {!loadError && groups.length === 0 ? (
        <PageEmpty
          title={
            hasAnyEmbeds
              ? 'No embeds match this filter'
              : 'No imported embeds yet'
          }
          description={
            hasAnyEmbeds
              ? undefined
              : 'Tracks imported from hearthis.at, Mixcloud, Spotify, or Bandcamp show up here, grouped by provider, once you import some from Settings → Add-ons → Import.'
          }
          action={
            hasAnyEmbeds ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setProviderFilter('ALL')}
              >
                Clear filter
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {groups.map(([provider, providerItems]) => (
        <section key={provider} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="size-6 shrink-0 overflow-hidden rounded">
              <SourceServiceIcon id={PROVIDER_SOURCE_ICON_ID[provider]} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              {EMBED_PROVIDER_LABEL[provider]}
            </h2>
            <span className="text-foreground-secondary text-xs">
              {providerItems.length}{' '}
              {providerItems.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {providerItems.map((item) => (
              <EmbedTrackRow
                key={item.id}
                title={item.title}
                provider={item.embedProvider}
                embedUri={item.embedUri}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
