import { PlayIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { playableFromHearthis } from '../api/sources';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  type EmbedProvider,
} from '../lib/embedSrc';
import { usePlayerStore } from '../stores/playerStore';

type Props = {
  title: string;
  provider: EmbedProvider;
  embedUri: string;
  className?: string;
};

/**
 * A track Tahti only references, never hosts (hearthis.at / Mixcloud /
 * Spotify). The provider's widget is the only way to play it, so we mount
 * their iframe -- which also supplies the real cover art and audio.
 *
 * The iframe only mounts after the listener clicks play, so the provider
 * never sees a listener's IP just from browsing the collection page.
 */
export function EmbedTrackRow({ title, provider, embedUri, className }: Props) {
  const [embedOpen, setEmbedOpen] = useState(false);
  const src = embedSrcFor(provider, embedUri);
  const label = EMBED_PROVIDER_LABEL[provider];
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const playerId = `hearthis:${embedUri}`;
  const isCurrent = currentId === playerId;
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');

  if (!src) {
    return null;
  }

  const start = () => {
    if (provider !== 'HEARTHIS') {
      setEmbedOpen(true);
      return;
    }
    if (isCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    setEmbedOpen(false);
    play(
      playableFromHearthis({
        id: embedUri,
        url: `https://hearthis.at/embed/${embedUri}/`,
        title,
        username: 'hearthis.at',
        durationSec: 0,
      }),
    );
  };

  return (
    <li
      className={`border-border overflow-hidden rounded-lg border ${className ?? ''}`}
    >
      {embedOpen ? (
        <iframe
          title={title}
          src={src}
          width="100%"
          height={EMBED_PROVIDER_HEIGHT[provider]}
          style={{ border: 0, display: 'block' }}
          allow="autoplay; encrypted-media"
          loading="lazy"
        />
      ) : (
        <Button
          variant="text"
          size="flexible"
          type="button"
          className="hover:bg-background-secondary flex w-full items-center gap-3 rounded-none px-3 py-2 text-left"
          onClick={() => void start()}
          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${title} on ${label}`}
        >
          <span className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
            <PlayIcon size={16} className="fill-current" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{title}</span>
            <span className="text-foreground-secondary block truncate text-xs">
              {isPlaying ? 'Playing in Tahti player' : `Listen on ${label}`}
            </span>
          </span>
          <span className="text-foreground-secondary shrink-0 font-mono text-[10px] tracking-wide uppercase">
            Embed
          </span>
        </Button>
      )}
    </li>
  );
}
