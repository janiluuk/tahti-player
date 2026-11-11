import { HeartIcon, ListMusicIcon, ListPlusIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Dialog,
  MediaArtwork,
  Tooltip,
} from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { useTrackLikes } from '../hooks/useTrackLikes';
import { soundIdFromPlayableId } from '../lib/soundId';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';

export type TrackInfoTracklistEntry = {
  id: string;
  title: string;
  active?: boolean;
  onSelect?: () => void;
};

export type TrackInfo = {
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
  /** Short line under the title — e.g. "3m ago" or "Live now". */
  meta?: string;
  /** Enables Love + Add to playlist — omitted for live/ephemeral signals
   * with no catalog entry (e.g. the current live broadcast). */
  playable?: TahtiPlayable | null;
  /** Sibling tracks (release/collection context) shown below the info —
   * omitted when the track was opened outside any such context. */
  tracklist?: TrackInfoTracklistEntry[];
};

/** Opened by clicking a track — artwork + info, love / add to playlist /
 * artist bio, and (when the track belongs to a release or collection) its
 * tracklist. Mirrors prod's profile track-detail modal. */
export function TrackInfoDialog({
  isOpen,
  onClose,
  track,
}: {
  isOpen: boolean;
  onClose: () => void;
  track: TrackInfo | null;
}) {
  const { t } = useTranslation('web');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const { canLike, isLiked, toggleLike } = useTrackLikes();

  const playable = track?.playable ?? null;
  const likeable = playable ? canLike(playable) : false;
  const liked = playable ? isLiked(playable) : false;
  const soundId = soundIdFromPlayableId(playable?.id);

  return (
    <>
      <Dialog.Root isOpen={isOpen && Boolean(track)} onClose={onClose}>
        {track && (
          <>
            <Dialog.Title>{t('trackInfo.title')}</Dialog.Title>
            <div className="mt-4 flex items-start gap-4">
              <MediaArtwork
                size="md"
                src={track.artworkUrl}
                alt=""
                seed={playable?.id ?? track.title}
                className="size-20 min-w-20 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold tracking-tight">
                  {track.title}
                </div>
                <div className="text-foreground-secondary mt-0.5 text-sm">
                  {track.artistName}
                </div>
                {track.meta && (
                  <div className="text-foreground-secondary mt-1 text-xs">
                    {track.meta}
                  </div>
                )}
                {playable && (
                  <div className="mt-2 flex items-center gap-1">
                    {likeable ? (
                      <Tooltip
                        content={
                          liked ? t('actions.unlike') : t('actions.like')
                        }
                        side="top"
                      >
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={
                            liked ? t('actions.unlike') : t('actions.like')
                          }
                          aria-pressed={liked}
                          onClick={() => toggleLike(playable)}
                        >
                          <HeartIcon
                            size={16}
                            className={
                              liked
                                ? 'text-accent-red-strong fill-current'
                                : undefined
                            }
                          />
                        </Button>
                      </Tooltip>
                    ) : null}
                    {soundId && (
                      <Tooltip content={t('actions.addToPlaylist')} side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={t('actions.addToPlaylist')}
                          onClick={() => setPlaylistOpen(true)}
                        >
                          <ListPlusIcon size={16} />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </div>

            {track.tracklist && track.tracklist.length > 0 && (
              <div className="border-border mt-4 flex flex-col gap-1 border-t pt-3">
                <div className="text-foreground-secondary mb-1 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                  <ListMusicIcon size={13} aria-hidden />
                  {t('trackInfoDialogText.tracklist')}
                </div>
                <ul className="flex max-h-48 flex-col overflow-y-auto">
                  {track.tracklist.map((entry, i) => (
                    <li key={entry.id}>
                      <Button
                        variant="text"
                        size="flexible"
                        type="button"
                        disabled={!entry.onSelect}
                        onClick={entry.onSelect}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm disabled:cursor-default disabled:opacity-100 ${
                          entry.active
                            ? 'text-primary-strong font-semibold'
                            : 'hover:bg-background-secondary'
                        }`}
                      >
                        <span className="text-foreground-secondary w-5 shrink-0 text-xs tabular-nums">
                          {i + 1}
                        </span>
                        <span className="truncate">{entry.title}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Dialog.Actions>
              <Dialog.Close>{t('actions.close')}</Dialog.Close>
              {track.artistUsername ? (
                <ButtonLink
                  to="/u/$username"
                  params={{ username: track.artistUsername }}
                  onClick={onClose}
                  variant="secondary"
                >
                  {t('trackInfo.artistPage')}
                </ButtonLink>
              ) : null}
            </Dialog.Actions>
          </>
        )}
      </Dialog.Root>

      {soundId && (
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          soundId={soundId}
          trackTitle={track?.title ?? ''}
          onClose={() => setPlaylistOpen(false)}
        />
      )}
    </>
  );
}
