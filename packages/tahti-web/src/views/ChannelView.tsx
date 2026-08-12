import { Link } from '@tanstack/react-router';
import { HeartIcon, MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@nuclearplayer/ui';

import {
  archiveItemToPlayable,
  fetchChannel,
  fetchChannelArchive,
  type FetchMeta,
} from '../api/client';
import type { ArchiveItem, PublicChannel, TahtiPlayable } from '../api/types';
import { ChannelChatPanel } from '../components/ChannelChatPanel';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

type Tab = 'live' | 'archive' | 'chat' | 'about';

export function ChannelView({ slug }: { slug: string }) {
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [archiveMeta, setArchiveMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('live');
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const isFavoriteChannel = useLibraryStore((s) => s.isFavoriteChannel);
  const setChatContext = useLayoutStore((s) => s.setChatContext);
  const openChatRail = useLayoutStore((s) => s.openChatRail);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([fetchChannel(slug), fetchChannelArchive(slug)]).then(
      ([ch, items]) => {
        if (cancelled) {
          return;
        }
        setChannel(ch.data);
        setMeta(ch.meta);
        setArchive(items.data);
        setArchiveMeta(items.meta);
        setLoading(false);
        if (ch.data?.state === 'LIVE') {
          setTab('live');
        } else if (items.data.length > 0) {
          setTab('archive');
        }

        const enabled = ch.data?.chatEnabled !== false;
        setChatContext({
          slug,
          enabled,
          reason: enabled ? null : 'Chat is disabled for this channel',
          autoOpen: enabled,
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug, setChatContext]);

  const playables: TahtiPlayable[] = useMemo(
    () =>
      archive
        .map((item) => archiveItemToPlayable(item, slug))
        .filter((p): p is TahtiPlayable => Boolean(p)),
    [archive, slug],
  );

  if (loading) {
    return (
      <p className="text-foreground-secondary text-sm">Loading channel…</p>
    );
  }

  if (!channel) {
    return <p className="text-sm">Channel not found.</p>;
  }

  const live = channel.state === 'LIVE' && Boolean(channel.hlsUrl);
  const favorited = isFavoriteChannel(slug);
  const chatOn = channel.chatEnabled !== false;

  const openChat = () => {
    if (!chatOn) {
      return;
    }
    setTab('chat');
    openChatRail(slug);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        to="/"
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← Listen
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {channel.user.displayName}
          </h1>
          <span
            className={
              live
                ? 'bg-primary text-foreground rounded px-2 py-0.5 text-xs font-bold uppercase'
                : 'text-foreground-secondary border-border rounded border px-2 py-0.5 text-xs uppercase'
            }
          >
            {channel.state}
          </span>
        </div>
        <p className="text-foreground-secondary text-sm">
          <Link
            to="/u/$username"
            params={{ username: channel.user.username }}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            @{channel.user.username}
          </Link>
        </p>
        {meta && (
          <p className="text-foreground-secondary text-xs">
            Source: {meta.source}
            {meta.reason ? ` (${meta.reason})` : ''}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!channel.hlsUrl}
          onClick={() => {
            void fetchChannel(slug).then(({ playable }) => {
              if (playable) {
                play(playable);
              }
            });
          }}
        >
          {live ? 'Play live' : 'Play stream'}
        </Button>
        <Button
          variant="text"
          disabled={!channel.hlsUrl}
          onClick={() => {
            void fetchChannel(slug).then(({ playable }) => {
              if (playable) {
                enqueue(playable);
              }
            });
          }}
        >
          Add to queue
        </Button>
        <Button
          variant="text"
          onClick={() =>
            toggleFavoriteChannel({
              slug,
              displayName: channel.user.displayName,
              avatarUrl: channel.user.avatarUrl,
            })
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <HeartIcon
              size={14}
              className={favorited ? 'fill-current' : undefined}
            />
            {favorited ? 'Favorited' : 'Favorite'}
          </span>
        </Button>
        {chatOn && (
          <Button size="sm" variant="secondary" onClick={openChat}>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle size={14} />
              Open chat
            </span>
          </Button>
        )}
        <Link
          to="/subscribe/$username"
          params={{ username: channel.user.username }}
          className="text-foreground-secondary self-center text-sm underline-offset-2 hover:underline"
        >
          Subscribe
        </Link>
      </div>

      <nav className="border-border flex flex-wrap gap-2 border-b pb-3">
        {(
          [
            { id: 'live' as const, label: 'Live' },
            { id: 'archive' as const, label: 'Archive' },
            { id: 'chat' as const, label: 'Chat' },
            { id: 'about' as const, label: 'About' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (t.id === 'chat') {
                openChat();
              } else {
                setTab(t.id);
              }
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium tracking-wide uppercase ${
              tab === t.id
                ? 'bg-primary text-foreground'
                : 'border-border text-foreground-secondary hover:text-foreground border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'live' && (
        <section className="flex flex-col gap-3">
          <div className="border-border relative aspect-[16/9] w-full overflow-hidden rounded-xl border">
            <ChannelVisualizer
              className="absolute inset-0 h-full w-full"
              preset={channel.visualPreset ?? 'AURORA'}
              colorScheme={channel.colorScheme}
              colorSchemeJson={channel.colorSchemeJson}
              artworkUrl={
                channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl
              }
            />
            <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/70 to-transparent p-4">
              {channel.nowPlaying ? (
                <>
                  <div className="text-[10px] tracking-wide text-white/70 uppercase">
                    Now playing
                  </div>
                  <div className="mt-0.5 font-bold text-white">
                    {channel.nowPlaying.title}
                  </div>
                  <div className="text-sm text-white/80">
                    {channel.nowPlaying.artistName}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/80">
                  {live
                    ? 'Stream is live — hit Play live to drive the visualizer.'
                    : 'Offline — visualizer idles until you play archive or live.'}
                </p>
              )}
              <p className="mt-1 text-[10px] text-white/50">
                Preset: {(channel.visualPreset ?? 'AURORA').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          {!live && (
            <p className="text-foreground-secondary text-sm">
              Channel is not live right now. Check Archive for past sets, or
              open Chat in the right rail.
            </p>
          )}
        </section>
      )}

      {tab === 'archive' && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">Archive</h2>
            {archiveMeta && (
              <span className="text-foreground-secondary text-xs">
                {archiveMeta.source}
                {archiveMeta.reason ? ` (${archiveMeta.reason})` : ''}
              </span>
            )}
          </div>
          <PlayableTrackTable
            items={playables}
            emptyMessage="No public archive items for this channel yet."
          />
        </section>
      )}

      {tab === 'chat' && (
        <section className="flex max-w-xl flex-col gap-3">
          {chatOn ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-foreground-secondary text-xs">
                  Same panel as the right rail (Queue / Chat). Captcha required
                  for anonymous join when configured.
                </p>
                <Button size="sm" variant="secondary" onClick={openChat}>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle size={14} />
                    Focus rail
                  </span>
                </Button>
              </div>
              <ChannelChatPanel slug={slug} />
              <p className="text-foreground-secondary text-xs">
                Full page:{' '}
                <Link
                  to="/chat/$slug"
                  params={{ slug }}
                  className="underline-offset-2 hover:underline"
                >
                  /chat/{slug}
                </Link>
              </p>
            </>
          ) : (
            <p className="text-foreground-secondary text-sm">
              Chat is disabled for this channel.
            </p>
          )}
        </section>
      )}

      {tab === 'about' && (
        <section className="flex flex-col gap-3">
          {channel.user.bio ? (
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {channel.user.bio}
            </p>
          ) : (
            <p className="text-foreground-secondary text-sm">No bio yet.</p>
          )}
          <Link
            to="/u/$username"
            params={{ username: channel.user.username }}
            className="text-sm underline-offset-2 hover:underline"
          >
            Full artist profile →
          </Link>
        </section>
      )}
    </div>
  );
}
