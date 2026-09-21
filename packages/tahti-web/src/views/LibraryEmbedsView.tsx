import { useEffect, useMemo, useState } from 'react';

import type { IntegrationId } from '../api/sources';
import { fetchStudioSounds } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { EmbedTrackRow } from '../components/EmbedTrackRow';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { SourceServiceIcon } from '../components/SourceServiceIcon';
import { EMBED_PROVIDER_LABEL, type EmbedProvider } from '../lib/embedSrc';

const PROVIDER_SOURCE_ICON_ID: Record<EmbedProvider, IntegrationId> = {
  HEARTHIS: 'hearthis',
  MIXCLOUD: 'mixcloud',
  SPOTIFY: 'spotify',
  BANDCAMP: 'bandcamp',
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

  useEffect(() => {
    let cancelled = false;
    void fetchStudioSounds().then((result) => {
      if (!cancelled) {
        setItems(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const byProvider = new Map<EmbedProvider, EmbedItem[]>();
    for (const item of items ?? []) {
      if (!isEmbedItem(item)) {
        continue;
      }
      const list = byProvider.get(item.embedProvider) ?? [];
      list.push(item);
      byProvider.set(item.embedProvider, list);
    }
    return [...byProvider.entries()].sort(([a], [b]) =>
      EMBED_PROVIDER_LABEL[a].localeCompare(EMBED_PROVIDER_LABEL[b]),
    );
  }, [items]);

  if (items === null) {
    return <PageLoading label="Loading embeds…" />;
  }

  if (groups.length === 0) {
    return (
      <PageEmpty
        title="No imported embeds yet"
        description="Tracks imported from hearthis.at, Mixcloud, Spotify, or Bandcamp show up here, grouped by provider, once you import some from Settings → Add-ons → Import."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
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
