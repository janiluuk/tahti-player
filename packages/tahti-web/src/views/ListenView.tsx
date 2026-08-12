import { Link } from '@tanstack/react-router';
import { HeartIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Box, Button, Card, CardGrid, FilterChips, Input } from '@nuclearplayer/ui';

import { fetchChannel, fetchDirectory, fetchRadio, type FetchMeta } from '../api/client';
import type { ChannelDirectoryItem, RadioStation } from '../api/types';
import { TAHTI_RADIO_SLUG } from '../api/types';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

export function ListenView() {
  const [items, setItems] = useState<ChannelDirectoryItem[]>([]);
  const [radio, setRadio] = useState<RadioStation | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const isFavoriteChannel = useLibraryStore((s) => s.isFavoriteChannel);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([fetchDirectory(), fetchRadio()]).then(
      ([dir, radioRes]) => {
        if (cancelled) {
          return;
        }
        setItems(dir.data.items);
        setMeta(dir.meta);
        setRadio(radioRes.data.hlsUrl ? radioRes.data : null);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const playRadio = async () => {
    const { playable } = await fetchRadio();
    if (playable) {
      play(playable);
    }
  };

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of items) {
      for (const g of ch.genres) {
        const key = g.trim();
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((ch) => {
      if (
        genre !== 'all' &&
        !ch.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
      ) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        ch.displayName.toLowerCase().includes(q) ||
        ch.slug.toLowerCase().includes(q) ||
        ch.genres.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [items, query, genre]);

  const playNow = async (slug: string) => {
    const { playable } = await fetchChannel(slug);
    if (playable) {
      play(playable);
    }
  };

  const add = async (slug: string) => {
    const { playable } = await fetchChannel(slug);
    if (playable) {
      enqueue(playable);
    }
  };

  const chipItems = useMemo(
    () => [
      { id: 'all', label: `All (${items.length})` },
      ...genres.map((g) => ({ id: g.name, label: `${g.name} (${g.count})` })),
    ],
    [genres, items.length],
  );

  return (
    <PageFrame>
      <PageHeader
        title="Listen"
        subtitle="Tahti channels on Nuclear chrome. Anonymous by default — no account to tune in."
        meta={
          meta
            ? `Data source: ${meta.source}${meta.reason ? ` (${meta.reason})` : ''}`
            : undefined
        }
        actions={
          user?.channel ? (
            <Link to="/studio/go-live">
              <Button size="sm">Go Live</Button>
            </Link>
          ) : undefined
        }
      />

      <Input
        label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Channel name, slug, genre…"
        className="max-w-md"
      />

      {genres.length > 0 && (
        <FilterChips items={chipItems} selected={genre} onChange={setGenre} />
      )}

      <p className="text-foreground-secondary text-xs">
        Showing {filtered.length} of {items.length} channels
      </p>

      {radio && (
        <Box variant="secondary" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-foreground-secondary text-xs uppercase tracking-wide">
              Always on
            </div>
            <Link
              to="/radio"
              className="text-foreground text-lg font-bold hover:underline"
            >
              Tahti Radio
            </Link>
            <p className="text-foreground-secondary truncate text-sm">
              {radio.nowPlaying
                ? `${radio.nowPlaying.title} — ${radio.nowPlaying.artistName}`
                : '24/7 community radio'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void playRadio()}>
              Play Radio
            </Button>
            <Link to="/radio">
              <Button size="sm" variant="secondary">
                Open
              </Button>
            </Link>
            <Link to="/channel/$slug" params={{ slug: TAHTI_RADIO_SLUG }}>
              <Button size="sm" variant="text">
                Channel
              </Button>
            </Link>
          </div>
        </Box>
      )}

      {loading ? (
        <PageLoading label="Loading channels…" />
      ) : filtered.length === 0 ? (
        <PageEmpty
          title="No channels match"
          description={`${query ? `“${query}”` : 'Try another filter'}${genre !== 'all' ? ` in ${genre}` : ''}.`}
        />
      ) : (
        <CardGrid>
          {filtered.map((ch) => {
            const favorited = isFavoriteChannel(ch.slug);
            return (
              <div key={ch.slug} className="flex flex-col gap-2">
                <Link to="/channel/$slug" params={{ slug: ch.slug }}>
                  <Card
                    title={ch.displayName}
                    subtitle={ch.genres.slice(0, 2).join(', ') || ch.slug}
                    src={ch.avatarUrl ?? undefined}
                  />
                </Link>
                <div className="flex flex-wrap gap-2 px-1">
                  <Button size="sm" onClick={() => void playNow(ch.slug)}>
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => void add(ch.slug)}
                  >
                    Queue
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() =>
                      toggleFavoriteChannel({
                        slug: ch.slug,
                        displayName: ch.displayName,
                        avatarUrl: ch.avatarUrl,
                      })
                    }
                    aria-label={favorited ? 'Remove favorite' : 'Add favorite'}
                  >
                    <HeartIcon
                      size={14}
                      className={favorited ? 'fill-current' : undefined}
                    />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardGrid>
      )}
    </PageFrame>
  );
}
