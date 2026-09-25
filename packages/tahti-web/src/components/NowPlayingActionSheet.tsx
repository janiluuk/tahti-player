import { useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  HeartIcon,
  ListMusicIcon,
  RadioTowerIcon,
  Share2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ActionSheet } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useAuthStore } from '../stores/authStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  playable: TahtiPlayable;
};

/** Tahti channel slug for a live/radio playable. Internet-radio stations
 * share the `radio:` id prefix but carry `sourceProvider: 'radio'` and a
 * station id, not a channel slug. */
function tahtiChannelSlug(playable: TahtiPlayable): string | null {
  if (playable.kind === 'sound' || !playable.channelSlug) {
    return null;
  }
  const provider = playable.sourceProvider ?? 'tahti';
  return provider === 'tahti' ? playable.channelSlug : null;
}

export function NowPlayingActionSheet({ isOpen, onClose, playable }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const closeFullScreen = useLayoutStore((s) => s.setFullScreenPlayerOpen);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const isFavorite = useLibraryStore((s) =>
    s.favoriteTracks.some((t) => t.id === playable.id),
  );
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const soundId = soundIdFromPlayableId(playable.id);
  const channelSlug = tahtiChannelSlug(playable);
  const shareUrl = channelSlug
    ? `${window.location.origin}/channel/${channelSlug}`
    : null;

  const share = async (url: string) => {
    const text = `Listen to ${playable.title} on Tahti`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: playable.title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const leaveFullScreen = () => closeFullScreen(false);

  return (
    <>
      <ActionSheet
        isOpen={isOpen}
        onClose={onClose}
        label="Now playing options"
      >
        <ActionSheet.Header
          title={playable.title}
          subtitle={playable.artist || undefined}
          coverUrl={playable.coverUrl}
        />
        {channelSlug ? (
          <ActionSheet.Action
            icon={<RadioTowerIcon size={22} />}
            onClick={() => {
              leaveFullScreen();
              void navigate({
                to: '/channel/$slug',
                params: { slug: channelSlug },
              });
            }}
          >
            Go to channel
          </ActionSheet.Action>
        ) : null}
        {shareUrl ? (
          <ActionSheet.Action
            icon={<Share2Icon size={22} />}
            onClick={() => void share(shareUrl)}
          >
            Share
          </ActionSheet.Action>
        ) : null}
        <ActionSheet.Action
          icon={
            <HeartIcon
              size={22}
              className={isFavorite ? 'fill-current' : undefined}
            />
          }
          onClick={() => toggleFavoriteTrack(playable)}
        >
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </ActionSheet.Action>
        {soundId ? (
          <ActionSheet.Action
            icon={<ListMusicIcon size={22} />}
            onClick={() => setPlaylistOpen(true)}
          >
            Add to playlist
          </ActionSheet.Action>
        ) : null}
        {soundId && user ? (
          <ActionSheet.Action
            icon={<AudioLinesIcon size={22} />}
            onClick={() => {
              leaveFullScreen();
              void navigate({
                to: '/studio/sounds/$id/editor',
                params: { id: soundId },
              });
            }}
          >
            Open in Pro Editor
          </ActionSheet.Action>
        ) : null}
      </ActionSheet>
      {soundId ? (
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          soundId={soundId}
          trackTitle={playable.title}
          onClose={() => setPlaylistOpen(false)}
        />
      ) : null}
    </>
  );
}
