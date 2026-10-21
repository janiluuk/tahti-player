import { embedSrcFor } from '../lib/embedSrc';

type Props = {
  embedUri: string;
  title: string;
  autoplay: boolean;
  compact?: boolean;
};

export function HearthisEmbedSurface({
  embedUri,
  title,
  autoplay,
  compact = false,
}: Props) {
  const src = embedSrcFor('HEARTHIS', embedUri, { compact });
  const height = compact ? 96 : 150;

  if (!src) {
    return null;
  }

  return (
    <iframe
      key={`${embedUri}-${autoplay ? 'playing' : 'paused'}`}
      title={`${title} — hearthis.at player`}
      src={src.replace('autoplay=0', `autoplay=${autoplay ? '1' : '0'}`)}
      width="100%"
      height={height}
      style={{ border: 0, display: 'block', height, maxHeight: height }}
      className="border-border block w-full max-w-full rounded-lg border"
      allow="autoplay"
      loading="lazy"
    />
  );
}
