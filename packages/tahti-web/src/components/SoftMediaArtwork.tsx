import { useEffect, useState, type ComponentProps } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import { fetchOembedThumbnail } from '../lib/embedThumbnail';

type ArtworkProps = ComponentProps<typeof MediaArtwork>;

type Props = {
  src?: string | null;
  pageUrl?: string | null;
  seed: string;
  alt: string;
  size?: ArtworkProps['size'];
  playLabel?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
};

export function SoftMediaArtwork({
  src,
  pageUrl,
  seed,
  alt,
  size,
  playLabel,
  isPlaying,
  onPlay,
}: Props) {
  const [soft, setSoft] = useState<string | null>(null);

  useEffect(() => {
    if (src || !pageUrl) {
      setSoft(null);
      return;
    }
    let cancelled = false;
    void fetchOembedThumbnail(pageUrl).then((thumb) => {
      if (!cancelled) {
        setSoft(thumb);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [src, pageUrl]);

  return (
    <MediaArtwork
      src={src || soft || undefined}
      alt={alt}
      seed={seed}
      size={size}
      playLabel={playLabel}
      isPlaying={isPlaying}
      onPlay={onPlay}
    />
  );
}
