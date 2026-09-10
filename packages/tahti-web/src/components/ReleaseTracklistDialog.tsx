import { Dialog, ImageReveal } from '@tahti-player/ui';

import type { PublicProfileRelease, TahtiPlayable } from '../api/types';
import { formatDuration } from '../lib/playableToTrack';
import { usePlayerStore } from '../stores/playerStore';
import { MediaIconActions, playQueueFavoriteActions } from './MediaIconActions';

export function releaseTrackPlayable(
  track: NonNullable<PublicProfileRelease['tracks']>[number],
  artist: string,
  release: PublicProfileRelease,
  channelSlug?: string,
): TahtiPlayable | null {
  if (!track.playUrl) {
    return null;
  }
  const isHls = track.playUrl.includes('.m3u8');
  return {
    id: `sound:${track.soundId ?? `${release.id}-${track.position}`}`,
    kind: 'sound',
    title: track.title,
    artist,
    coverUrl: release.artworkUrl ?? undefined,
    streamUrl: track.playUrl,
    protocol: isHls ? 'hls' : 'https',
    channelSlug,
  };
}

/** All playable tracks on a release, in track-listing order. */
export function releasePlayables(
  release: PublicProfileRelease,
  artist: string,
  channelSlug?: string,
): TahtiPlayable[] {
  return [...(release.tracks ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((t) => releaseTrackPlayable(t, artist, release, channelSlug))
    .filter((p): p is TahtiPlayable => Boolean(p));
}

export function ReleaseTracklistDialog({
  isOpen,
  onClose,
  release,
  artistName,
  channelSlug,
}: {
  isOpen: boolean;
  onClose: () => void;
  release: PublicProfileRelease | null;
  artistName: string;
  channelSlug?: string;
}) {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const queue = usePlayerStore((s) => s.queue);

  const tracks = [...(release?.tracks ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <Dialog.Root
      isOpen={isOpen && Boolean(release)}
      onClose={onClose}
      className="max-w-lg"
    >
      {release && (
        <>
          <div className="flex items-start gap-4">
            <div className="bg-surface-secondary flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-bold tracking-tight">
              <ImageReveal
                src={release.artworkUrl ?? undefined}
                alt=""
                className="size-full"
                placeholder={
                  <span>{release.title.slice(0, 2).toUpperCase()}</span>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title>{release.title}</Dialog.Title>
              <p className="text-foreground-secondary mt-0.5 text-xs uppercase">
                {release.type ?? 'Release'}
                {release.releaseDate
                  ? ` · ${new Date(release.releaseDate).getFullYear()}`
                  : ''}
              </p>
            </div>
          </div>

          {tracks.length === 0 ? (
            <p className="text-foreground-secondary mt-4 text-sm">
              No tracklist available for this release.
            </p>
          ) : (
            <ul className="divide-border mt-4 flex max-h-96 flex-col divide-y overflow-y-auto">
              {tracks.map((track) => {
                const playable = releaseTrackPlayable(
                  track,
                  artistName,
                  release,
                  channelSlug,
                );
                const isPlaying = Boolean(
                  playable && playable.id === currentId,
                );
                const isActivelyPlaying =
                  isPlaying &&
                  (playerStatus === 'playing' || playerStatus === 'loading');
                return (
                  <li
                    key={track.position}
                    className={`flex items-center gap-3 py-2 first:pt-0 last:pb-0 ${
                      isPlaying
                        ? 'bg-accent-green/10 -mx-2 rounded-lg px-2'
                        : ''
                    }`}
                  >
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        isPlaying ? 'text-accent-green font-semibold' : ''
                      }`}
                    >
                      {track.title}
                    </span>
                    {track.durationSec != null && (
                      <span className="text-foreground-secondary hidden shrink-0 text-xs tabular-nums sm:inline">
                        {formatDuration(track.durationSec)}
                      </span>
                    )}
                    <MediaIconActions
                      actions={playQueueFavoriteActions({
                        onPlay: () => playable && play(playable),
                        onTogglePause: () =>
                          setPlayerStatus(
                            playerStatus === 'playing' ||
                              playerStatus === 'loading'
                              ? 'paused'
                              : 'playing',
                          ),
                        isPlaying: isActivelyPlaying,
                        onQueue: () => playable && enqueue(playable),
                        playDisabled: !playable,
                        queueDisabled: !playable,
                        playLabel: `Play ${track.title}`,
                        queueLabel: `Queue ${track.title}`,
                        queued: Boolean(
                          playable &&
                          queue.some(
                            (queueItem) => queueItem.id === playable.id,
                          ),
                        ),
                      })}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <Dialog.Actions>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Actions>
        </>
      )}
    </Dialog.Root>
  );
}
