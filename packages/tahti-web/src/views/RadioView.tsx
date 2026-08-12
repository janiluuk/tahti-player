import { Link } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Box, Button } from '@nuclearplayer/ui';

import { fetchRadio, type FetchMeta } from '../api/client';
import type { RadioStation, TahtiPlayable } from '../api/types';
import { PageFrame, PageHeader } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { useLayoutStore } from '../stores/layoutStore';
import { usePlayerStore } from '../stores/playerStore';

const REFRESH_MS = 30_000;

function formatPlayedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function RadioView() {
  const [station, setStation] = useState<RadioStation | null>(null);
  const [playable, setPlayable] = useState<TahtiPlayable | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const setChatContext = useLayoutStore((s) => s.setChatContext);
  const openChatRail = useLayoutStore((s) => s.openChatRail);

  const reload = (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true);
    }
    void fetchRadio().then((res) => {
      setStation(res.data);
      setPlayable(res.playable);
      setMeta(res.meta);
      setLoading(false);
      setChatContext({
        slug: res.data.slug,
        enabled: res.data.chatEnabled,
        reason: res.data.chatEnabled
          ? null
          : 'Chat is disabled for Tahti Radio',
        autoOpen: false,
      });
    });
  };

  useEffect(() => {
    reload();
    const id = window.setInterval(() => reload({ quiet: true }), REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + poll only
  }, []);

  const guest =
    station?.memberRelay.live && station.memberRelay.channel
      ? station.memberRelay.channel
      : null;

  return (
    <PageFrame maxWidth="2xl">
      <PageHeader
        title="Tahti Radio"
        subtitle="24/7 community radio — curated rotation, with live guest slots when booked."
        meta={
          meta
            ? `Source: ${meta.source}${meta.reason ? ` (${meta.reason})` : ''}`
            : undefined
        }
      />

      {loading && !station ? (
        <PageLoading label="Tuning Tahti Radio…" />
      ) : !station?.hlsUrl ? (
        <PageEmpty
          icon="radio"
          title="Tahti Radio is temporarily offline"
          description="No HLS stream right now. Browse live channels or check back soon."
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => reload()}>
                Refresh
              </Button>
              <Link to="/">
                <Button size="sm" variant="text">
                  Browse listen
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {guest && (
            <p
              className="bg-primary/15 text-foreground rounded px-3 py-2 text-sm"
              role="status"
            >
              Live guest slot:{' '}
              <strong>
                {guest.artistName ?? guest.displayName ?? guest.slug}
              </strong>
              {guest.slug && (
                <>
                  {' — '}
                  <Link
                    to="/channel/$slug"
                    params={{ slug: guest.slug }}
                    className="underline-offset-2 hover:underline"
                  >
                    open channel
                  </Link>
                </>
              )}
            </p>
          )}

          <Box variant="secondary" className="flex flex-col gap-4 sm:flex-row">
            {station.nowPlaying?.artworkUrl ? (
              <img
                src={station.nowPlaying.artworkUrl}
                alt=""
                className="border-border h-28 w-28 shrink-0 rounded border object-cover"
              />
            ) : (
              <div className="bg-background-secondary border-border text-foreground-secondary flex h-28 w-28 shrink-0 items-center justify-center rounded border text-xs uppercase">
                Radio
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <div className="text-foreground-secondary text-xs uppercase tracking-wide">
                  {guest ? 'On air (live slot)' : 'Now playing'}
                </div>
                <div className="text-foreground mt-1 text-xl font-bold">
                  {station.nowPlaying?.title ?? 'Tahti Radio'}
                </div>
                <div className="text-foreground-secondary text-sm">
                  {station.nowPlaying?.artistName ?? station.displayName}
                </div>
                <div className="text-foreground-secondary mt-1 text-xs">
                  @{station.username}
                  {station.state === 'LIVE' ? ', LIVE' : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!playable}
                  onClick={() => {
                    if (playable) {
                      play(playable);
                    } else {
                      void fetchRadio().then(({ playable: next }) => {
                        if (next) {
                          play(next);
                        }
                      });
                    }
                  }}
                >
                  Play Radio
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!playable}
                  onClick={() => {
                    if (playable) {
                      enqueue(playable);
                    }
                  }}
                >
                  Queue
                </Button>
                {station.chatEnabled && (
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => openChatRail(station.slug)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle size={14} />
                      Chat
                    </span>
                  </Button>
                )}
                <Link to="/channel/$slug" params={{ slug: station.slug }}>
                  <Button size="sm" variant="text">
                    Channel page
                  </Button>
                </Link>
              </div>
            </div>
          </Box>

          {station.recentlyPlayed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-foreground text-sm font-semibold uppercase tracking-wide">
                Recently played
              </h2>
              <ul className="divide-border border-border divide-y rounded border">
                {station.recentlyPlayed.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    {item.artworkUrl ? (
                      <img
                        src={item.artworkUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="bg-background-secondary h-10 w-10 shrink-0 rounded" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate text-sm font-medium">
                        {item.title}
                      </div>
                      <div className="text-foreground-secondary truncate text-xs">
                        {item.artistUsername ? (
                          <Link
                            to="/u/$username"
                            params={{ username: item.artistUsername }}
                            className="hover:underline"
                          >
                            {item.artistName}
                          </Link>
                        ) : (
                          item.artistName
                        )}
                      </div>
                    </div>
                    <time className="text-foreground-secondary shrink-0 text-xs">
                      {formatPlayedAt(item.playedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageFrame>
  );
}
