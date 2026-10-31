import { useEffect, useState } from 'react';

import { fetchProfile } from '../../api/client';
import type {
  PublicProfile,
  PublicProfileRelease,
  TahtiPlayable,
} from '../../api/types';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { AlbumPlayPromptDialog } from '../artist-view/AlbumPlayPromptDialog';
import {
  ArtistPlaylistsGrid,
  ArtistReleasesGrid,
} from '../artist-view/ArtistReferenceSections';
import { useArtistCatalog } from '../artist-view/useArtistCatalog';
import { ProfileSection } from '../ProfileSection';
import { QueueConfirmDialog } from '../QueueConfirmDialog';
import {
  releasePlayables,
  ReleaseTracklistDialog,
} from '../ReleaseTracklistDialog';

type AlbumPrompt = { title: string; playables: TahtiPlayable[] };
type QueuePrompt = { title: string; playables: TahtiPlayable[] };

export function ChannelCatalogSections({
  username,
  displayName,
  channelSlug,
}: {
  username: string;
  displayName: string;
  channelSlug: string;
}) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const [albumPrompt, setAlbumPrompt] = useState<AlbumPrompt | null>(null);
  const [queuePrompt, setQueuePrompt] = useState<QueuePrompt | null>(null);
  const [tracklistRelease, setTracklistRelease] =
    useState<PublicProfileRelease | null>(null);
  const play = usePlayerStore((state) => state.play);
  const enqueue = usePlayerStore((state) => state.enqueue);
  const queueLength = usePlayerStore((state) => state.queue.length);
  const favoriteTracks = useLibraryStore((state) => state.favoriteTracks);
  const toggleFavoriteTrack = useLibraryStore(
    (state) => state.toggleFavoriteTrack,
  );
  const { releaseTiles } = useArtistCatalog(
    status === 'ready' ? profile : null,
  );

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetchProfile(username)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setProfile(result.data);
        setStatus(
          result.meta.source === 'api' && result.meta.reason
            ? 'error'
            : 'ready',
        );
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, username]);

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

  if (status === 'loading') {
    return (
      <ProfileSection
        title="Releases"
        status="loading"
        loadingLabel="Loading releases…"
      />
    );
  }

  if (status === 'error') {
    return (
      <ProfileSection
        title="Releases"
        status="error"
        errorTitle="Releases couldn't load"
        errorDescription="Tracks above are unaffected."
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <>
      <ArtistReleasesGrid
        releases={releaseTiles}
        artistName={displayName}
        channelSlug={channelSlug}
        isFavorite={(playable) =>
          favoriteTracks.some((track) => track.id === playable.id)
        }
        onPlayRelease={(release) => {
          const playables = releasePlayables(release, displayName, channelSlug);
          if (playables.length === 0) {
            return;
          }
          if (queueLength > 0) {
            setAlbumPrompt({ title: release.title, playables });
            return;
          }
          playAlbum(playables);
        }}
        onQueueRelease={(release, playables) => {
          if (playables.length > 1) {
            setQueuePrompt({ title: release.title, playables });
            return;
          }
          queueAlbum(playables);
        }}
        onToggleFavorite={toggleFavoriteTrack}
        onTitleClick={setTracklistRelease}
      />
      <ArtistPlaylistsGrid
        collections={profile?.collections ?? []}
        username={username}
      />
      <AlbumPlayPromptDialog
        title={albumPrompt?.title ?? null}
        onClose={() => setAlbumPrompt(null)}
        onQueue={() => {
          if (albumPrompt) {
            queueAlbum(albumPrompt.playables);
          }
          setAlbumPrompt(null);
        }}
        onPlayNow={() => {
          if (albumPrompt) {
            playAlbum(albumPrompt.playables);
          }
          setAlbumPrompt(null);
        }}
      />
      <QueueConfirmDialog
        isOpen={queuePrompt != null}
        count={queuePrompt?.playables.length ?? 0}
        sourceLabel={queuePrompt?.title ?? 'this release'}
        onCancel={() => setQueuePrompt(null)}
        onConfirm={() => {
          if (queuePrompt) {
            queueAlbum(queuePrompt.playables);
          }
          setQueuePrompt(null);
        }}
      />
      <ReleaseTracklistDialog
        isOpen={tracklistRelease != null}
        onClose={() => setTracklistRelease(null)}
        release={tracklistRelease}
        artistName={displayName}
        channelSlug={channelSlug}
      />
    </>
  );
}
