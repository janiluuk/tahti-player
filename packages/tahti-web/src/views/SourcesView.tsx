import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Button, Card, CardGrid } from '@nuclearplayer/ui';

import {
  connectIntegrationMock,
  disconnectIntegration,
  fetchConnectionStatus,
  fetchSoundcloudTracks,
  fetchStashDownload,
  fetchStashFiles,
  importSoundcloudTracks,
  oauthCallbackHint,
  oauthStartUrl,
  playableFromSoundcloud,
  playableFromSpotify,
  searchSpotifyTracks,
  SOURCE_DEFS,
  type ConnectionStatus,
  type IntegrationId,
  type SoundcloudTrack,
  type SpotifySearchTrack,
  type StashFile,
} from '../api/sources';
import { isForceMock } from '../api/mode';
import {
  SourceServiceIcon,
  sourceTileSubtitle,
} from '../components/SourceServiceIcon';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

const forceMock = () => isForceMock();

type TileStatus = {
  status: ConnectionStatus | null;
  metaSource: string;
  errorReason?: string;
};

function statusChip(
  defKind: (typeof SOURCE_DEFS)[number]['kind'],
  tile: TileStatus | undefined,
): { label: string; color: 'green' | 'orange' | 'cyan' | 'secondary' } {
  if (!tile?.status) {
    return { label: '…', color: 'secondary' };
  }
  // Only label Mock when intentionally offline (FORCE_MOCK), not on API errors.
  if (forceMock()) {
    return { label: 'Mock', color: 'cyan' };
  }
  if (tile.metaSource === 'api' && tile.errorReason) {
    if (!tile.status.configured) {
      return { label: 'Not configured', color: 'secondary' };
    }
    return { label: 'API error', color: 'orange' };
  }
  if (defKind === 'upload' || defKind === 'tool' || defKind === 'search') {
    if (tile.status.connected) {
      return { label: 'Ready', color: 'green' };
    }
    return { label: 'Open', color: 'secondary' };
  }
  if (tile.status.connected) {
    return { label: 'Connected', color: 'green' };
  }
  if (tile.status.configured) {
    return { label: 'Needs auth', color: 'orange' };
  }
  return { label: 'Not configured', color: 'secondary' };
}

export function SourcesView({ tabId }: { tabId?: IntegrationId }) {
  const user = useAuthStore((s) => s.user);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const navigate = useNavigate();

  const selected =
    tabId && SOURCE_DEFS.some((d) => d.id === tabId) ? tabId : undefined;
  const def = selected ? SOURCE_DEFS.find((d) => d.id === selected)! : null;

  const [tiles, setTiles] = useState<
    Partial<Record<IntegrationId, TileStatus>>
  >({});
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [metaSource, setMetaSource] = useState('…');
  const [metaReason, setMetaReason] = useState<string | undefined>();
  const [scTracks, setScTracks] = useState<SoundcloudTrack[]>([]);
  const [stash, setStash] = useState<StashFile[]>([]);
  const [spotifyQ, setSpotifyQ] = useState('');
  const [spotifyHits, setSpotifyHits] = useState<SpotifySearchTrack[]>([]);
  const [urlPaste, setUrlPaste] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Overview: load connection status for every integration (plugin-store style chips).
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      SOURCE_DEFS.map(async (d) => {
        const r = await fetchConnectionStatus(d.id);
        return [
          d.id,
          {
            status: r.data,
            metaSource: r.meta.source,
            errorReason: r.meta.reason,
          },
        ] as const;
      }),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setTiles(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    void fetchConnectionStatus(selected).then((r) => {
      if (cancelled) {
        return;
      }
      setStatus(r.data);
      setMetaSource(r.meta.source);
      setMetaReason(r.meta.reason);
      setTiles((prev) => ({
        ...prev,
        [selected]: {
          status: r.data,
          metaSource: r.meta.source,
          errorReason: r.meta.reason,
        },
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (selected !== 'soundcloud' || !status?.connected) {
      return;
    }
    void fetchSoundcloudTracks().then((r) => setScTracks(r.data));
  }, [selected, status?.connected]);

  useEffect(() => {
    if (selected !== 'stash') {
      return;
    }
    void fetchStashFiles().then((r) => setStash(r.data));
  }, [selected]);

  function refreshSelectedStatus() {
    if (!selected) {
      return;
    }
    void fetchConnectionStatus(selected).then((r) => {
      setStatus(r.data);
      setMetaSource(r.meta.source);
      setMetaReason(r.meta.reason);
      setTiles((prev) => ({
        ...prev,
        [selected]: {
          status: r.data,
          metaSource: r.meta.source,
          errorReason: r.meta.reason,
        },
      }));
    });
  }

  // After OAuth (often finishes on production), refresh when the tab is focused again.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refreshSelectedStatus();
      }
    };
    window.addEventListener('focus', onVis);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onVis);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshSelectedStatus closes over selected
  }, [selected]);

  // Soft success hints if the user somehow lands with provider query flags.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const q = new URLSearchParams(window.location.search);
    const flags = [
      q.get('sc'),
      q.get('bc'),
      q.get('gd'),
      q.get('mixcloud'),
    ].filter(Boolean);
    if (flags.includes('connected')) {
      setNote('OAuth reported connected — refreshing status from live API.');
      refreshSelectedStatus();
    } else if (flags.includes('error') || flags.includes('login')) {
      setNote(
        'OAuth did not complete (error or login required). Try Connect again while signed in.',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const overview = useMemo(() => SOURCE_DEFS, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Sources
        </h1>
        <p className="text-foreground-secondary mt-1 text-sm">
          Connect and import from services — pick a tile to open its tools. One
          sidebar entry; detail stays in this pane.
        </p>
        {!user && (
          <p className="text-foreground-secondary mt-2 text-xs">
            <Link to="/login" className="underline-offset-2 hover:underline">
              Sign in
            </Link>{' '}
            to connect OAuth sources.
          </p>
        )}
      </div>

      {!selected && (
        <CardGrid
          data-testid="sources-grid"
          className="grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
        >
          {overview.map((d) => {
            const chip = statusChip(d.kind, tiles[d.id]);
            return (
              <div key={d.id} className="relative">
                <Card
                  title={d.name}
                  subtitle={sourceTileSubtitle(d.id)}
                  className="w-full max-w-none"
                  image={<SourceServiceIcon id={d.id} />}
                  onClick={() => {
                    void navigate({ to: '/sources/$id', params: { id: d.id } });
                  }}
                />
                <div className="pointer-events-none absolute top-3 right-3 z-10">
                  <Badge variant="pill" color={chip.color}>
                    {chip.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardGrid>
      )}

      {selected && def && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="text"
              onClick={() => {
                void navigate({ to: '/sources' });
              }}
            >
              ← All sources
            </Button>
            <nav className="flex flex-wrap gap-1.5">
              {overview.map((t) => (
                <Link
                  key={t.id}
                  to="/sources/$id"
                  params={{ id: t.id }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                    selected === t.id
                      ? 'bg-primary text-foreground'
                      : 'border-border text-foreground-secondary hover:text-foreground border'
                  }`}
                >
                  {t.name}
                </Link>
              ))}
            </nav>
          </div>

          <section className="border-border flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start">
            <div className="border-border h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
              <SourceServiceIcon id={selected} size="detail" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">{def.name}</h2>
                {(() => {
                  const chip = statusChip(
                    def.kind,
                    tiles[selected] ?? {
                      status,
                      metaSource,
                      errorReason: metaReason,
                    },
                  );
                  return (
                    <Badge variant="pill" color={chip.color}>
                      {chip.label}
                    </Badge>
                  );
                })()}
              </div>
              <p className="text-foreground-secondary mt-1 text-xs tracking-wide uppercase">
                Status source: {metaSource}
                {metaReason ? ` — ${metaReason}` : ''}
              </p>
              <p className="text-foreground-secondary mt-2 text-sm">
                {def.description}
              </p>
              {def.kind === 'oauth' && !forceMock() && (
                <p className="text-foreground-secondary mt-2 text-xs leading-relaxed">
                  Live OAuth uses the production API. Provider callbacks return
                  to tahti.live import pages; reopen this tile afterward (or hit
                  Refresh status). Mock Connect only exists under{' '}
                  <code>VITE_FORCE_MOCK=1</code>.
                </p>
              )}
              {status?.configured === false && (
                <p className="text-foreground-secondary mt-2 text-xs">
                  This integration is not configured on the API (missing client
                  credentials).
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {def.kind === 'oauth' && def.oauthStartPath && (
                  <>
                    {forceMock() ? (
                      <Button
                        size="sm"
                        disabled={!user}
                        onClick={() => {
                          const id = selected as
                            | 'bandcamp'
                            | 'soundcloud'
                            | 'google-drive'
                            | 'mixcloud'
                            | 'spotify';
                          void connectIntegrationMock(id).then((r) => {
                            setNote(
                              r.ok
                                ? `Mock connected ${def.name} (FORCE_MOCK only).`
                                : r.error,
                            );
                            refreshSelectedStatus();
                          });
                        }}
                      >
                        {status?.connected ? 'Reconnect (mock)' : 'Connect (mock)'}
                      </Button>
                    ) : (
                      <>
                        <a
                          href={
                            user ? oauthStartUrl(def.oauthStartPath) : '/login'
                          }
                          onClick={() => {
                            if (!user) {
                              return;
                            }
                            setNote(oauthCallbackHint(selected));
                          }}
                        >
                          <Button
                            size="sm"
                            disabled={!user || status?.configured === false}
                          >
                            {status?.connected ? 'Reconnect' : 'Connect'}
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setNote('Refreshing connection status…');
                            refreshSelectedStatus();
                          }}
                        >
                          Refresh status
                        </Button>
                      </>
                    )}
                    {status?.connected && (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => {
                          const id = selected as
                            | 'bandcamp'
                            | 'soundcloud'
                            | 'google-drive'
                            | 'mixcloud';
                          void disconnectIntegration(id).then((r) => {
                            setNote(r.ok ? 'Disconnected.' : r.error);
                            refreshSelectedStatus();
                          });
                        }}
                      >
                        Disconnect
                      </Button>
                    )}
                  </>
                )}
                {def.studioDeepLink && (
                  <Link to={def.studioDeepLink as '/studio/upload'}>
                    <Button size="sm" variant="secondary">
                      Open in Studio
                    </Button>
                  </Link>
                )}
                {selected === 'stash' && (
                  <Link to="/studio/stash">
                    <Button size="sm" variant="secondary">
                      Studio stash
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {note && (
            <p className="text-foreground-secondary border-border rounded border px-3 py-2 text-sm">
              {note}
            </p>
          )}

          {selected === 'soundcloud' && status?.connected && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold">Tracks</h2>
              {scTracks.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No tracks returned.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {scTracks.map((t) => (
                    <li
                      key={t.id}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{t.title}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => play(playableFromSoundcloud(t))}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setBusy(true);
                            void importSoundcloudTracks([
                              { trackId: t.id, title: t.title },
                            ]).then((r) => {
                              setBusy(false);
                              setNote(
                                r.ok
                                  ? `Queued import (${r.count}). Check Studio → Music.`
                                  : r.error,
                              );
                            });
                          }}
                        >
                          Import
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {selected === 'spotify' && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <input
                  className="border-border bg-background text-foreground min-w-[200px] flex-1 rounded border px-2 py-1.5 text-sm"
                  value={spotifyQ}
                  onChange={(e) => setSpotifyQ(e.target.value)}
                  placeholder="Search Spotify tracks"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    void searchSpotifyTracks(spotifyQ.trim()).then((r) =>
                      setSpotifyHits(r.data),
                    );
                  }}
                >
                  Search
                </Button>
              </div>
              <ul className="flex flex-col gap-2">
                {spotifyHits.map((t) => (
                  <li
                    key={t.id}
                    className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-foreground-secondary text-xs">
                        {t.artists?.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => play(playableFromSpotify(t))}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => enqueue(playableFromSpotify(t))}
                      >
                        Queue
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {selected === 'stash' && (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-bold">Files</h2>
              {stash.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  Stash is empty.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stash.map((f) => (
                    <li
                      key={f.id}
                      className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{f.filename}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          void fetchStashDownload(f.id).then((r) => {
                            if (r.data?.url) {
                              play({
                                id: `stash:${f.id}`,
                                kind: 'archive',
                                title: f.filename,
                                artist: 'Stash',
                                streamUrl: r.data.url,
                                protocol: 'https',
                                sourceProvider: 'stash',
                              });
                            }
                          });
                        }}
                      >
                        Play
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {selected === 'url' && (
            <section className="flex flex-col gap-3">
              <p className="text-foreground-secondary text-sm">
                Paste a DSP URL to open Studio releases (smart-link targets).
              </p>
              <input
                className="border-border bg-background text-foreground w-full rounded border px-2 py-1.5 text-sm"
                value={urlPaste}
                onChange={(e) => setUrlPaste(e.target.value)}
                placeholder="https://open.spotify.com/track/…"
              />
              <Link to="/studio/releases">
                <Button size="sm">Open releases editor</Button>
              </Link>
            </section>
          )}

          {(selected === 'bandcamp' ||
            selected === 'google-drive' ||
            selected === 'mixcloud' ||
            selected === 'broadcast' ||
            selected === 'upload') && (
            <p className="text-foreground-secondary text-sm">
              {selected === 'broadcast' ? (
                <>
                  Promote captures from{' '}
                  <Link
                    to="/studio/go-live"
                    className="underline-offset-2 hover:underline"
                  >
                    Go Live
                  </Link>{' '}
                  or browse Music after a show ends.
                </>
              ) : selected === 'upload' ? (
                <>
                  Use{' '}
                  <Link
                    to="/studio/upload"
                    className="underline-offset-2 hover:underline"
                  >
                    Studio → Upload
                  </Link>{' '}
                  for prepare → PUT → complete.
                </>
              ) : (
                <>
                  Connect above, then use import UIs when list endpoints return
                  data. Mock mode pretends the provider is connected.
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
