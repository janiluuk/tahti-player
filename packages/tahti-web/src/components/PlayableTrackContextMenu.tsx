import { useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  HeartIcon,
  ListEndIcon,
  ListMusicIcon,
  ListPlusIcon,
  ListStartIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { QueueItem, Track } from '@tahti-player/model';
import { Input, TrackContextMenu } from '@tahti-player/ui';

import { addStudioCollectionItem, fetchStudioCollections } from '../api/studio';
import type { StudioCollection } from '../api/studio-types';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useMasteringFeatureStore } from '../plugins/mastering/store';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';

const PLAYLIST_FILTER_THRESHOLD = 5;
const MAX_VISIBLE_PLAYLISTS = 8;

/** Per-row context menu for `PlayableTrackTable` — Storybook TrackContextMenu
 * with With Submenu playlists and Audio tools when the track is an archive
 * sound the signed-in user can edit. */
export function PlayableTrackContextMenu({
  track,
  children,
}: {
  track: Track;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [playlists, setPlaylists] = useState<StudioCollection[]>([]);
  const [playlistFilter, setPlaylistFilter] = useState('');
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const play = usePlayerStore((state) => state.play);
  const playNext = usePlayerStore((state) => state.playNext);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const toggleFavoriteTrack = useLibraryStore(
    (state) => state.toggleFavoriteTrack,
  );
  const isFavorite = useLibraryStore((state) =>
    state.favoriteTracks.some((item) => item.id === track.source.id),
  );
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const soundId = soundIdFromPlayableId(track.source.id);
  const artistNames = track.artists.map((artist) => artist.name).join(', ');
  const coverUrl = track.artwork?.items[0]?.url;

  useEffect(() => {
    if (!user || !soundId) {
      setPlaylists([]);
      return;
    }
    let cancelled = false;
    void fetchStudioCollections().then((result) => {
      if (cancelled) {
        return;
      }
      const rows = result.data.filter(
        (collection) =>
          !collection.style ||
          collection.style === 'PLAYLIST' ||
          collection.style === 'CUSTOM',
      );
      setPlaylists(rows.length > 0 ? rows : result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [soundId, user]);

  const visiblePlaylists = useMemo(() => {
    const filtered = playlistFilter
      ? playlists.filter((collection) =>
          collection.name.toLowerCase().includes(playlistFilter.toLowerCase()),
        )
      : playlists;
    return filtered.slice(0, MAX_VISIBLE_PLAYLISTS);
  }, [playlistFilter, playlists]);

  const showPlaylistFilter = playlists.length >= PLAYLIST_FILTER_THRESHOLD;
  const showAudioTools = Boolean(soundId && user);

  const toPlayable = () => {
    const queueItem: QueueItem = {
      id: track.source.id,
      track,
      status: 'idle',
      addedAtIso: new Date().toISOString(),
    };
    return playableFromQueueItem(queueItem);
  };

  const addToPlaylist = async (slug: string, name: string) => {
    if (!soundId) {
      return;
    }
    setAddingSlug(slug);
    const result = await addStudioCollectionItem(slug, soundId);
    setAddingSlug(null);
    if (result.ok) {
      toast.success(`Added to ${name}`);
      return;
    }
    toast.error(result.error);
  };

  return (
    <>
      <TrackContextMenu>
        <TrackContextMenu.Trigger>{children}</TrackContextMenu.Trigger>
        <TrackContextMenu.Content>
          <TrackContextMenu.Header
            title={track.title}
            subtitle={artistNames || undefined}
            coverUrl={coverUrl}
          />
          <TrackContextMenu.Action
            icon={<PlayIcon size={16} />}
            onClick={() => {
              const playable = toPlayable();
              if (playable) {
                play(playable);
              }
            }}
          >
            Play now
          </TrackContextMenu.Action>
          <TrackContextMenu.Action
            icon={<ListStartIcon size={16} />}
            onClick={() => {
              const playable = toPlayable();
              if (playable) {
                playNext(playable);
              }
            }}
          >
            Play next
          </TrackContextMenu.Action>
          <TrackContextMenu.Action
            icon={<ListEndIcon size={16} />}
            onClick={() => {
              const playable = toPlayable();
              if (playable) {
                enqueue(playable);
              }
            }}
          >
            Add to queue
          </TrackContextMenu.Action>
          <TrackContextMenu.Action
            icon={
              <HeartIcon
                size={16}
                className={
                  isFavorite ? 'text-accent-red fill-current' : undefined
                }
              />
            }
            onClick={() => {
              const playable = toPlayable();
              if (playable) {
                toggleFavoriteTrack(playable);
              }
            }}
          >
            {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          </TrackContextMenu.Action>
          {soundId ? (
            <TrackContextMenu.Submenu>
              <TrackContextMenu.Submenu.Trigger
                icon={<ListMusicIcon size={16} />}
              >
                Add to playlist
              </TrackContextMenu.Submenu.Trigger>
              <TrackContextMenu.Submenu.Content>
                {showPlaylistFilter ? (
                  <div onKeyDown={(event) => event.stopPropagation()}>
                    <Input
                      size="sm"
                      variant="borderless"
                      placeholder="Filter playlists"
                      value={playlistFilter}
                      onChange={(event) =>
                        setPlaylistFilter(event.target.value)
                      }
                      data-testid="playlist-filter-input"
                    />
                  </div>
                ) : null}
                {visiblePlaylists.map((collection) => (
                  <TrackContextMenu.Action
                    key={collection.slug}
                    icon={<ListPlusIcon size={16} />}
                    onClick={() => {
                      if (addingSlug) {
                        return;
                      }
                      void addToPlaylist(collection.slug, collection.name);
                    }}
                    data-testid="playlist-submenu-item"
                  >
                    {collection.name}
                  </TrackContextMenu.Action>
                ))}
                <TrackContextMenu.Action
                  icon={<PlusIcon size={16} />}
                  onClick={() => setCreatePlaylistOpen(true)}
                >
                  New playlist…
                </TrackContextMenu.Action>
              </TrackContextMenu.Submenu.Content>
            </TrackContextMenu.Submenu>
          ) : null}
          {showAudioTools ? (
            <TrackContextMenu.Submenu>
              <TrackContextMenu.Submenu.Trigger icon={<WrenchIcon size={16} />}>
                Audio tools
              </TrackContextMenu.Submenu.Trigger>
              <TrackContextMenu.Submenu.Content>
                <TrackContextMenu.Action
                  icon={<AudioLinesIcon size={16} />}
                  onClick={() =>
                    void navigate({
                      to: '/studio/sounds/$id/editor',
                      params: { id: soundId! },
                    })
                  }
                >
                  Open in Pro Editor
                </TrackContextMenu.Action>
                {masteringEnabled ? (
                  <TrackContextMenu.Action
                    icon={<SparklesIcon size={16} />}
                    onClick={() =>
                      void navigate({
                        to: '/studio/mastering/$id',
                        params: { id: soundId! },
                      })
                    }
                  >
                    Reference mastering
                  </TrackContextMenu.Action>
                ) : null}
              </TrackContextMenu.Submenu.Content>
            </TrackContextMenu.Submenu>
          ) : null}
        </TrackContextMenu.Content>
      </TrackContextMenu>
      {soundId ? (
        <AddToPlaylistPanel
          isOpen={createPlaylistOpen}
          soundId={soundId}
          trackTitle={track.title}
          onClose={() => setCreatePlaylistOpen(false)}
        />
      ) : null}
    </>
  );
}
