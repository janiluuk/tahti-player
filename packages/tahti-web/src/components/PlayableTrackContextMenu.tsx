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
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import type { QueueItem, Track } from '@tahti-player/model';
import { Input, TrackContextMenu } from '@tahti-player/ui';

import {
  addStudioCollectionItem,
  fetchStudioCollections,
  removeStudioCollectionItem,
} from '../api/studio';
import type { StudioCollection } from '../api/studio-types';
import type { TahtiPlayable } from '../api/types';
import { useTrackLikes } from '../hooks/useTrackLikes';
import { soundIdFromPlayableId } from '../lib/soundId';
import { toastWithUndo } from '../lib/undoToast';
import { useMasteringFeatureStore } from '../plugins/mastering/store';
import { useAuthStore } from '../stores/authStore';
import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';

const PLAYLIST_FILTER_THRESHOLD = 5;
const MAX_VISIBLE_PLAYLISTS = 8;

/** Maps a table row back to the playable it was built from. `Track` drops
 * the channel slug, which the like API needs. */
export const PlayableTrackResolverContext = createContext<
  (track: Track) => TahtiPlayable | null
>(() => null);

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
  const resolvePlayable = useContext(PlayableTrackResolverContext);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);
  const [playlists, setPlaylists] = useState<StudioCollection[]>([]);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [playlistFilter, setPlaylistFilter] = useState('');
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const play = usePlayerStore((state) => state.play);
  const playNext = usePlayerStore((state) => state.playNext);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const { t } = useTranslation('web');
  const { canLike, isLiked, toggleLike } = useTrackLikes();
  const masteringEnabled = useMasteringFeatureStore((state) => state.enabled);
  const soundId = soundIdFromPlayableId(track.source.id);
  const artistNames = track.artists.map((artist) => artist.name).join(', ');
  const coverUrl = track.artwork?.items[0]?.url;

  useEffect(() => {
    if (!user || !soundId) {
      setPlaylists([]);
      setPlaylistsError(null);
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
      setPlaylistsError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
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
    const resolved = resolvePlayable(track);
    if (resolved) {
      return resolved;
    }
    const queueItem: QueueItem = {
      id: track.source.id,
      track,
      status: 'idle',
      addedAtIso: new Date().toISOString(),
    };
    return playableFromQueueItem(queueItem);
  };
  const likeSubject = resolvePlayable(track) ?? {
    id: track.source.id,
    kind: track.source.id.startsWith('sound:')
      ? ('sound' as const)
      : ('live' as const),
  };
  const liked = isLiked(likeSubject);

  const addToPlaylist = async (slug: string, name: string) => {
    if (!soundId) {
      return;
    }
    setAddingSlug(slug);
    const result = await addStudioCollectionItem(slug, soundId);
    setAddingSlug(null);
    if (result.ok) {
      const { itemId } = result;
      if (itemId) {
        toastWithUndo(t('toasts.addedToNamed', { name }), {
          undo: () => removeStudioCollectionItem(slug, itemId),
          undoneMessage: t('toasts.removedFromNamed', { name }),
        });
      } else {
        toast.success(t('toasts.addedToNamed', { name }));
      }
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
            {t('trackContextMenu.playNow')}
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
            {t('trackContextMenu.playNext')}
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
            {t('trackContextMenu.addToQueue')}
          </TrackContextMenu.Action>
          {canLike(likeSubject) ? (
            <TrackContextMenu.Action
              icon={
                <HeartIcon
                  size={16}
                  className={
                    liked ? 'text-accent-red-strong fill-current' : undefined
                  }
                />
              }
              onClick={() => toggleLike(likeSubject)}
              data-testid="track-context-menu-like"
            >
              {liked ? t('actions.unlike') : t('actions.like')}
            </TrackContextMenu.Action>
          ) : null}
          {soundId ? (
            <TrackContextMenu.Submenu>
              <TrackContextMenu.Submenu.Trigger
                icon={<ListMusicIcon size={16} />}
              >
                {t('trackContextMenu.addToPlaylist')}
              </TrackContextMenu.Submenu.Trigger>
              <TrackContextMenu.Submenu.Content>
                {showPlaylistFilter ? (
                  <div onKeyDown={(event) => event.stopPropagation()}>
                    <Input
                      enterKeyHint="search"
                      aria-label={t('trackContextMenu.filterPlaylists')}
                      type="search"
                      size="sm"
                      variant="borderless"
                      placeholder={t('trackContextMenu.filterPlaylists')}
                      value={playlistFilter}
                      onChange={(event) =>
                        setPlaylistFilter(event.target.value)
                      }
                      data-testid="playlist-filter-input"
                    />
                  </div>
                ) : null}
                {playlistsError && playlists.length === 0 ? (
                  <TrackContextMenu.Action
                    icon={<ListPlusIcon size={16} />}
                    disabled
                    onClick={() => undefined}
                    data-testid="playlist-submenu-error"
                  >
                    {t('trackContextMenu.couldNotLoadPlaylists')}
                  </TrackContextMenu.Action>
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
                  {t('trackContextMenu.newPlaylist')}
                </TrackContextMenu.Action>
              </TrackContextMenu.Submenu.Content>
            </TrackContextMenu.Submenu>
          ) : null}
          {showAudioTools ? (
            <TrackContextMenu.Submenu>
              <TrackContextMenu.Submenu.Trigger icon={<WrenchIcon size={16} />}>
                {t('trackContextMenu.audioTools')}
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
                  {t('trackContextMenu.openInProEditor')}
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
                    {t('trackContextMenu.referenceMastering')}
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
