import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import { fetchOembedThumbnail } from '../lib/embedThumbnail';

type ArtworkProps = ComponentProps<typeof MediaArtwork>;

type Props = {
  src?: string | null;
  pageUrl?: string | null;
  seed: string;
  alt: string;
  size?: ArtworkProps['size'];
  className?: string;
  playLabel?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onSoftArtwork?: (url: string) => void;
};

export function SoftMediaArtwork({
  src,
  pageUrl,
  seed,
  alt,
  size,
  className,
  playLabel,
  isPlaying,
  onPlay,
  onSoftArtwork,
}: Props) {
  const [soft, setSoft] = useState<string | null>(null);
  const onSoftArtworkRef = useRef(onSoftArtwork);
  onSoftArtworkRef.current = onSoftArtwork;

  useEffect(() => {
    if (src || !pageUrl) {
      setSoft(null);
      return;
    }
    let cancelled = false;
    void fetchOembedThumbnail(pageUrl).then((thumb) => {
      if (cancelled) {
        return;
      }
      setSoft(thumb);
      if (thumb) {
        onSoftArtworkRef.current?.(thumb);
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
      className={className}
      playLabel={playLabel}
      isPlaying={isPlaying}
      onPlay={onPlay}
    />
  );
}
