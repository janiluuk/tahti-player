import { Meter } from '@tahti-player/ui';

export const slideshowSwatch = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="hsl(${hue} 60% 45%)"/><text x="8" y="20" fill="white" font-size="12" font-family="sans-serif">${hue}</text></svg>`,
  )}`;

export const LONG_SLIDESHOW_IMAGES = Array.from({ length: 16 }, (_, index) =>
  slideshowSwatch((index * 23) % 360),
);

export function MockBackdropUploadProgress({
  progress = 0.42,
}: {
  progress?: number;
}) {
  const pct = Math.round(progress * 100);
  return (
    <div className="flex w-full items-center gap-2 text-xs">
      <Meter
        value={pct}
        className="flex-1"
        aria-label={`Uploading slideshow image, ${pct}%`}
      />
      <span className="text-foreground-secondary w-9 text-right tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
