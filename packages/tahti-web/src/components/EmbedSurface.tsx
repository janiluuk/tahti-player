import type { EmbedPlaybackProvider } from '../api/types';
import {
  EMBED_PROVIDER_HEIGHT,
  EMBED_PROVIDER_LABEL,
  embedSrcFor,
  type EmbedProvider,
} from '../lib/embedSrc';

type Props = {
  provider: EmbedPlaybackProvider;
  embedUri: string;
  title: string;
  autoplay: boolean;
  compact?: boolean;
};

/** The provider's own widget, rendered in the shared player surfaces
 * (bottom bar / full-screen player) for any EMBED_ONLY track. Only
 * hearthis.at's embed URL carries a client-side `autoplay` toggle; the
 * others mount as-is. `compact` trims the height to fit the bottom bar. */
export function EmbedSurface({
  provider,
  embedUri,
  title,
  autoplay,
  compact = false,
}: Props) {
  const upper = provider.toUpperCase() as EmbedProvider;
  const src = embedSrcFor(upper, embedUri, { compact });
  const label = EMBED_PROVIDER_LABEL[upper];
  const height = compact ? 96 : (EMBED_PROVIDER_HEIGHT[upper] ?? 150);

  if (!src) {
    return null;
  }

  const finalSrc =
    provider === 'hearthis'
      ? src.replace('autoplay=0', `autoplay=${autoplay ? '1' : '0'}`)
      : src;

  return (
    <iframe
      key={`${provider}-${embedUri}-${autoplay ? 'playing' : 'paused'}`}
      title={`${title} — ${label} player`}
      src={finalSrc}
      width="100%"
      height={height}
      className="border-border block w-full rounded-lg border"
      allow="autoplay; encrypted-media"
      loading="lazy"
    />
  );
}
