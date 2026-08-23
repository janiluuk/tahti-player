import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { Button, Card, CardGrid, Dialog } from '@nuclearplayer/ui';

import {
  fetchMyPressKitImages,
  fetchPublicPressKitImages,
  type PublicPressKitImage,
} from '../api/artist-settings';
import { fetchChannel, fetchProfile } from '../api/client';
import type {
  PublicChannel,
  PublicProfile,
  PublicProfileRelease,
  TahtiPlayable,
} from '../api/types';
import {
  ArtistGalleryAddIcon,
  ArtistGalleryPanel,
} from '../components/ArtistGalleryPanel';
import { ChannelDesigner } from '../components/ChannelDesigner';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { GlowMediaTile } from '../components/GlowMediaTile';
import { ImageLightbox } from '../components/ImageLightbox';
import { NewsletterSubscribeToggle } from '../components/NewsletterSubscribeToggle';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from '../components/ReleaseTracklistDialog';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { archiveItemIdFromPlayableId } from '../lib/archiveId';
import { isPinned } from '../lib/pinnedTracks';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';

const GLOW_COLORS = [
  'var(--color-accent-purple)',
  'var(--color-accent-cyan)',
  'var(--color-accent-red)',
  'var(--color-accent-green)',
  'var(--color-accent-yellow)',
  'var(--color-accent-blue)',
];

function releaseToPlayable(
  release: PublicProfile['releases'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  const track = release.tracks?.find((t) => t.playUrl);
  if (!track?.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `archive:${track.archiveItemId ?? release.id}`,
    kind: 'archive',
    title: track.title,
    artist,
    coverUrl: release.artworkUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
  };
}

type Tab = 'music' | 'releases' | 'collections' | 'gallery' | 'design';

export function profileTrackToPlayable(
  track: PublicProfile['tracks'][number],
  artist: string,
  channelSlug?: string,
): TahtiPlayable | null {
  if (!track.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `archive:${track.id}`,
    kind: 'archive',
    title: track.title,
    artist: track.artistName ?? artist,
    coverUrl: track.bannerUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
  };
}

export function ArtistView({ username }: { username: string }) {
  const me = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('music');
  const [galleryImages, setGalleryImages] = useState<PublicPressKitImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [tracklistRelease, setTracklistRelease] =
    useState<PublicProfileRelease | null>(null);
  const [albumPrompt, setAlbumPrompt] = useState<{
    release: PublicProfileRelease;
    playables: TahtiPlayable[];
  } | null>(null);
  const [channelVisual, setChannelVisual] = useState<Pick<
    PublicChannel,
    'visualPreset' | 'colorScheme' | 'colorSchemeJson'
  > | null>(null);
  const [editingArchiveId, setEditingArchiveId] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const navigate = useNavigate();
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);

  const playAlbum = (playables: TahtiPlayable[]) => {
    const [head, ...rest] = playables;
    if (head) {
      play(head, { enqueueRest: rest });
    }
  };

  const queueAlbum = (playables: TahtiPlayable[]) => {
    for (const item of playables) {
      enqueue(item);
    }
  };

  const playOrPromptAlbum = (
    release: PublicProfileRelease,
    artist: string,
    channelSlug?: string,
  ) => {
    const playables = releasePlayables(release, artist, channelSlug);
    if (playables.length === 0) {
      return;
    }
    if (usePlayerStore.getState().queue.length > 0) {
      setAlbumPrompt({ release, playables });
      return;
    }
    playAlbum(playables);
  };

  const isOwner = Boolean(me && me.username === username);
  const hasGallery = galleryImages.length > 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchProfile(username).then((res) => {
      if (cancelled) {
        return;
      }
      setProfile(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    const slug = profile?.channel?.slug;
    if (!slug) {
      setChannelVisual(null);
      return;
    }
    let cancelled = false;
    void fetchChannel(slug).then((res) => {
      if (!cancelled) {
        setChannelVisual({
          visualPreset: res.data.visualPreset,
          colorScheme: res.data.colorScheme,
          colorSchemeJson: res.data.colorSchemeJson,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.channel?.slug]);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoaded(false);
    const load = isOwner
      ? fetchMyPressKitImages().then((res) =>
          res.data.map(({ id, imageUrl, title }) => ({ id, imageUrl, title })),
        )
      : fetchPublicPressKitImages(username).then((res) => res.data);
    void load.then((images) => {
      if (cancelled) {
        return;
      }
      setGalleryImages(images);
      setGalleryLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [username, isOwner]);

  useEffect(() => {
    if (tab === 'gallery' && !hasGallery) {
      setTab('music');
    }
  }, [tab, hasGallery]);

  const { pinnedPlayables, pinnedTiles, catalogPlayables, releaseTiles } =
    useMemo(() => {
      if (!profile) {
        return {
          pinnedPlayables: [],
          pinnedTiles: [],
          catalogPlayables: [],
          releaseTiles: [],
        };
      }
      const artist = profile.artist.displayName;
      const slug = profile.channel?.slug;
      const pinnedTracks = [...profile.tracks]
        .filter((t) => isPinned(t))
        .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
      const pinnedIds = new Set(pinnedTracks.map((t) => t.id));
      const toPlayable = (t: PublicProfile['tracks'][number]) =>
        profileTrackToPlayable(t, artist, slug);

      const pinnedTiles = pinnedTracks
        .map((t) => ({ track: t, playable: toPlayable(t) }))
        .filter(
          (
            x,
          ): x is {
            track: (typeof pinnedTracks)[number];
            playable: TahtiPlayable;
          } => Boolean(x.playable),
        );

      const releaseTiles = [...profile.releases]
        .sort((a, b) =>
          (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''),
        )
        .slice(0, 6)
        .map((release) => ({
          release,
          playable: releaseToPlayable(release, artist, slug),
        }));

      return {
        pinnedPlayables: pinnedTracks
          .map(toPlayable)
          .filter((p): p is TahtiPlayable => Boolean(p)),
        pinnedTiles,
        catalogPlayables: profile.tracks
          .filter((t) => !pinnedIds.has(t.id))
          .map(toPlayable)
          .filter((p): p is TahtiPlayable => Boolean(p)),
        releaseTiles,
      };
    }, [profile]);

  if (loading) {
    return <p className="text-foreground-secondary text-sm">Loading artist…</p>;
  }

  if (!profile) {
    return <p className="text-sm">Artist not found.</p>;
  }

  const { artist, channel, releases, collections, fanTiers } = profile;

  const currentQueueItem = queue.find((q) => q.id === currentId);
  const currentPlayable = currentQueueItem
    ? playableFromQueueItem(currentQueueItem)
    : null;
  const nowPlayingHere =
    currentPlayable?.artist === artist.displayName ? currentPlayable : null;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'music', label: 'Music' },
    { id: 'releases', label: 'Releases' },
    { id: 'collections', label: 'Collections' },
    ...(hasGallery ? [{ id: 'gallery' as const, label: 'Gallery' }] : []),
    ...(isOwner ? [{ id: 'design' as const, label: 'Design' }] : []),
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        to="/"
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← Listen
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            {artist.avatarUrl ? (
              <button
                type="button"
                className="border-border size-20 shrink-0 overflow-hidden rounded-xl border shadow-md sm:size-24"
                aria-label={`View ${artist.displayName} profile picture`}
                onClick={() => setAvatarOpen(true)}
              >
                <img
                  src={artist.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ) : null}
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">
                {artist.displayName}
              </h1>
              <p className="text-foreground-secondary text-sm">
                @{artist.username}
              </p>
            </div>
          </div>
          {isOwner && channel?.slug ? (
            <Link
              to="/channel/$slug"
              params={{ slug: channel.slug }}
              search={{ edit: '1' }}
            >
              <Button size="sm" variant="secondary">
                Edit design
              </Button>
            </Link>
          ) : isOwner ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setTab('design')}
            >
              Edit look
            </Button>
          ) : null}
        </div>
        {artist.bio && (
          <p className="text-foreground mt-2 max-w-2xl text-sm whitespace-pre-wrap">
            {artist.bio}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {channel && (
            <Link
              to="/channel/$slug"
              params={{ slug: channel.slug }}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Open channel ({channel.state})
            </Link>
          )}
          {fanTiers.length > 0 ? (
            <Link
              to="/subscribe/$username"
              params={{ username: artist.username }}
              className="text-foreground-secondary underline-offset-2 hover:underline"
            >
              Support artist
            </Link>
          ) : null}
          {channel && (
            <Link
              to="/u/$username/green-room"
              params={{ username: artist.username }}
              className="text-foreground-secondary underline-offset-2 hover:underline"
            >
              Green room
            </Link>
          )}
          {!isOwner && artist.freeSubscriptionsEnabled !== false && (
            <NewsletterSubscribeToggle
              artistUsername={artist.username}
              artistDisplayName={artist.displayName}
            />
          )}
          {isOwner && (
            <Link
              to="/studio/channel"
              className="text-foreground-secondary underline-offset-2 hover:underline"
            >
              Full studio settings
            </Link>
          )}
        </div>
      </header>

      {fanTiers.length > 0 && (
        <p className="text-foreground-secondary text-xs">
          Fan tiers:{' '}
          {fanTiers
            .map((t) => `${t.name} (€${(t.amountCents / 100).toFixed(0)})`)
            .join(', ')}
        </p>
      )}

      <div className="border-border flex flex-wrap items-center gap-2 border-b pb-3">
        <nav
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Profile sections"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
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
        {isOwner && galleryLoaded && !hasGallery ? (
          <ArtistGalleryAddIcon
            onCreated={(images) => {
              setGalleryImages(images);
              setTab('gallery');
            }}
          />
        ) : null}
      </div>

      {tab === 'music' && (
        <section className="flex flex-col gap-8">
          <div className="border-border bg-background-input relative h-32 w-full overflow-hidden rounded-lg border sm:h-40">
            <ChannelVisualizer
              className="absolute inset-0 h-full w-full"
              preset={channelVisual?.visualPreset}
              colorScheme={channelVisual?.colorScheme}
              colorSchemeJson={channelVisual?.colorSchemeJson}
              artworkUrl={nowPlayingHere?.coverUrl ?? artist.avatarUrl}
            />
            {nowPlayingHere ? (
              <span className="absolute top-3 left-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-white uppercase backdrop-blur-sm">
                <span
                  className="bg-accent-green size-1.5 rounded-full motion-safe:animate-pulse"
                  aria-hidden
                />
                Now playing
              </span>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-[1] flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-3 sm:gap-4 sm:p-4">
              {nowPlayingHere ? (
                <>
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-white/10 shadow-lg ring-1 ring-white/15 sm:size-14">
                    {nowPlayingHere.coverUrl ? (
                      <img
                        src={nowPlayingHere.coverUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs font-bold text-white/70">
                        {nowPlayingHere.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base leading-tight font-bold text-white sm:text-lg">
                      {nowPlayingHere.title}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-white/75">
                      {artist.displayName}
                    </div>
                  </div>
                </>
              ) : (
                <div className="truncate text-base leading-tight font-bold text-white sm:text-lg">
                  {artist.displayName}
                </div>
              )}
            </div>
          </div>

          {pinnedTiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Eyebrow>Pinned</Eyebrow>
                {isOwner && (
                  <Link
                    to="/studio/archive"
                    className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                  >
                    Manage pins in Studio
                  </Link>
                )}
              </div>
              <CardGrid className="grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6">
                {pinnedTiles.map(({ track, playable }, i) => (
                  <GlowMediaTile
                    key={track.id}
                    title={track.title}
                    subtitle={track.artistName ?? artist.displayName}
                    src={track.bannerUrl ?? undefined}
                    glowColor={GLOW_COLORS[i % GLOW_COLORS.length]}
                    onPlay={() => play(playable)}
                    onQueue={() => enqueue(playable)}
                    onFavorite={() => toggleFavoriteTrack(playable)}
                    favorited={favoriteTracks.some((t) => t.id === playable.id)}
                  />
                ))}
              </CardGrid>
            </div>
          )}

          {releaseTiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Eyebrow>Latest releases</Eyebrow>
                {releases.length > releaseTiles.length && (
                  <button
                    type="button"
                    onClick={() => setTab('releases')}
                    className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
                  >
                    View all {releases.length}
                  </button>
                )}
              </div>
              <CardGrid className="grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-8">
                {releaseTiles.map(({ release, playable }, i) => (
                  <GlowMediaTile
                    key={release.id}
                    title={release.title}
                    subtitle={release.type ?? 'Release'}
                    src={release.artworkUrl ?? undefined}
                    glowColor={GLOW_COLORS[(i + 2) % GLOW_COLORS.length]}
                    className="w-full"
                    onClick={
                      release.smartLinkSlug
                        ? () => {
                            void navigate({
                              to: '/r/$slug',
                              params: { slug: release.smartLinkSlug! },
                            });
                          }
                        : undefined
                    }
                    onTitleClick={() => setTracklistRelease(release)}
                    onPlay={
                      playable
                        ? () =>
                            playOrPromptAlbum(
                              release,
                              artist.displayName,
                              channel?.slug,
                            )
                        : undefined
                    }
                    onQueue={
                      playable
                        ? () =>
                            queueAlbum(
                              releasePlayables(
                                release,
                                artist.displayName,
                                channel?.slug,
                              ),
                            )
                        : undefined
                    }
                    onFavorite={
                      playable ? () => toggleFavoriteTrack(playable) : undefined
                    }
                    favorited={
                      playable
                        ? favoriteTracks.some((t) => t.id === playable.id)
                        : false
                    }
                  />
                ))}
              </CardGrid>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Eyebrow>Catalog</Eyebrow>
            <PlayableTrackTable
              items={catalogPlayables}
              artistUsername={artist.username}
              emptyMessage={
                pinnedPlayables.length > 0
                  ? 'No other tracks on this profile.'
                  : 'No playable tracks on this profile.'
              }
              onEdit={
                isOwner
                  ? (item) =>
                      setEditingArchiveId(archiveItemIdFromPlayableId(item.id))
                  : undefined
              }
            />
          </div>
        </section>
      )}

      {tab === 'releases' && (
        <section className="flex flex-col gap-3">
          {releases.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No published releases.
            </p>
          ) : (
            <CardGrid>
              {releases.map((rel) => (
                <div key={rel.id} className="flex flex-col gap-2">
                  {rel.smartLinkSlug ? (
                    <Link to="/r/$slug" params={{ slug: rel.smartLinkSlug }}>
                      <Card
                        title={rel.title}
                        subtitle={rel.type ?? 'Release'}
                        src={rel.artworkUrl ?? undefined}
                      />
                    </Link>
                  ) : (
                    <Card
                      title={rel.title}
                      subtitle={rel.type ?? 'Release'}
                      src={rel.artworkUrl ?? undefined}
                    />
                  )}
                </div>
              ))}
            </CardGrid>
          )}
        </section>
      )}

      {tab === 'collections' && (
        <section className="flex flex-col gap-3">
          {collections.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No public collections.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {collections.map((col) => (
                <li
                  key={col.slug}
                  className="border-border flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div>
                    <Link
                      to="/u/$username/c/$slug"
                      params={{ username: artist.username, slug: col.slug }}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {col.name}
                    </Link>
                    <div className="text-foreground-secondary text-xs">
                      {col.itemCount} items
                      {col.isFeatured ? ', featured' : ''}
                    </div>
                  </div>
                  <span className="text-foreground-secondary font-mono text-xs uppercase">
                    {col.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'gallery' && hasGallery && (
        <ArtistGalleryPanel
          images={galleryImages}
          isOwner={isOwner}
          onChange={(next) => {
            setGalleryImages(next);
            if (next.length === 0) {
              setTab('music');
            }
          }}
        />
      )}

      {tab === 'design' && isOwner && (
        <div className="flex flex-col gap-3">
          {channel?.slug ? (
            <p className="text-foreground-secondary text-sm">
              Full layout editing (layers, hide/add, drag) lives on the{' '}
              <Link
                to="/channel/$slug"
                params={{ slug: channel.slug }}
                search={{ edit: '1' }}
                className="underline-offset-2 hover:underline"
              >
                channel page
              </Link>
              . Quick look controls below.
            </p>
          ) : null}
          <ChannelDesigner
            displayName={artist.displayName}
            username={artist.username}
            channelSlug={channel?.slug}
            avatarUrl={artist.avatarUrl}
            bio={artist.bio}
            compact
          />
        </div>
      )}

      <ReleaseTracklistDialog
        isOpen={Boolean(tracklistRelease)}
        onClose={() => setTracklistRelease(null)}
        release={tracklistRelease}
        artistName={artist.displayName}
        channelSlug={channel?.slug}
      />

      <TrackEditDialog
        archiveItemId={editingArchiveId}
        onClose={() => setEditingArchiveId(null)}
        onSaved={() => {
          void fetchProfile(username).then((res) => setProfile(res.data));
        }}
      />

      {avatarOpen && artist.avatarUrl ? (
        <ImageLightbox
          images={[{ imageUrl: artist.avatarUrl }]}
          index={0}
          label={`${artist.displayName} profile picture`}
          onClose={() => setAvatarOpen(false)}
        />
      ) : null}

      <Dialog.Root
        isOpen={Boolean(albumPrompt)}
        onClose={() => setAlbumPrompt(null)}
      >
        {albumPrompt && (
          <>
            <Dialog.Title>Play {albumPrompt.release.title}?</Dialog.Title>
            <Dialog.Description>
              Something&apos;s already queued — add this album to the end, or
              play it now instead?
            </Dialog.Description>
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Button
                variant="secondary"
                onClick={() => {
                  queueAlbum(albumPrompt.playables);
                  setAlbumPrompt(null);
                }}
              >
                Queue album
              </Button>
              <Button
                onClick={() => {
                  playAlbum(albumPrompt.playables);
                  setAlbumPrompt(null);
                }}
              >
                Play now
              </Button>
            </Dialog.Actions>
          </>
        )}
      </Dialog.Root>
    </div>
  );
}
