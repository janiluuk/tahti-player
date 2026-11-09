import { PlayIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { playableFromHearthis } from '../api/sources';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  type EmbedProvider,
} from '../lib/embedSrc';
import { usePlayerStore } from '../stores/playerStore';
import { useHearthisEmbedClaim } from './HearthisEmbedHost';
import { HearthisEmbedSurface } from './HearthisEmbedSurface';
import { LibraryItemRow } from './library/LibraryItemRow';

type Props = {
  title: string;
  provider: EmbedProvider;
  embedUri: string;
  className?: string;
  /** Render as a plain block when the caller already owns the list item. */
  as?: 'li' | 'div';
  /** Row actions (edit, stats, queue, more) shown beside the title, so a
   * caller doesn't repeat the title on a second line for them. */
  actions?: ReactNode;
};

/**
 * A track Tahti only references, never hosts (hearthis.at / Mixcloud /
 * Spotify). The provider's widget is the only way to play it, so we mount
 * their iframe -- which also supplies the real cover art and audio.
 *
 * The iframe only mounts after the listener clicks play, so the provider
 * never sees a listener's IP just from browsing the collection page.
 */
export function EmbedTrackRow({
  title,
  provider,
  embedUri,
  className,
  as: Container = 'li',
  actions,
}: Props) {
  const { t } = useTranslation('web');
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
  useHearthisEmbedClaim(provider === 'HEARTHIS' && isCurrent);

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
    <Container
      className={`border-border overflow-hidden rounded-lg border ${className ?? ''}`}
    >
      {provider === 'HEARTHIS' && isCurrent ? (
        <div
          className="relative max-h-28 overflow-hidden contain-paint"
          data-testid="hearthis-row-embed"
        >
          <HearthisEmbedSurface
            embedUri={embedUri}
            title={title}
            autoplay={isPlaying}
            compact
          />
        </div>
      ) : embedOpen ? (
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
        <div className="flex items-center">
          <Button
            variant="text"
            size="flexible"
            type="button"
            className="hover:bg-background-secondary min-w-0 flex-1 rounded-none px-3 py-2 text-left"
            onClick={() => void start()}
            aria-label={`${isPlaying ? 'Pause' : 'Play'} ${title} on ${label}`}
          >
            <LibraryItemRow
              className="w-full py-0"
              artwork={
                <span className="bg-primary/15 text-primary-strong flex size-10 items-center justify-center rounded-md">
                  <PlayIcon size={16} className="fill-current" aria-hidden />
                </span>
              }
              title={<span className="block truncate">{title}</span>}
              subtitle={t('embedTrackRowLabels.listenOnLabel', { label })}
              actions={
                <span className="text-foreground-secondary font-mono text-[10px] tracking-wide uppercase">
                  {t('embedTrackRowText.embed')}
                </span>
              }
            />
          </Button>
          {actions ? (
            <div className="flex shrink-0 items-center gap-1 pr-2">
              {actions}
            </div>
          ) : null}
        </div>
      )}
      {actions && (embedOpen || (provider === 'HEARTHIS' && isCurrent)) ? (
        <div className="border-border flex items-center justify-end gap-1 border-t px-2 py-1">
          {actions}
        </div>
      ) : null}
    </Container>
  );
}
