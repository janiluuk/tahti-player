import type { ReactNode } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import type {
  NowPlayingOverlayPresetId,
  NowPlayingOverlaySettings,
} from '../content/nowPlayingOverlayPresets';

type Props = {
  presetId: NowPlayingOverlayPresetId;
  title: string;
  artist: string;
  artworkUrl?: string | null;
  /** The channel's real WaveformSeekbar, pre-built by the caller (it needs a
   * trackId/onSeek closure this component has no business owning) — laid
   * out differently per preset. Omitted entirely in designer previews. */
  seekbar?: ReactNode;
  /** Smaller text/art for the Channel Designer's preset picker cards. */
  compact?: boolean;
  settings?: NowPlayingOverlaySettings;
};

/** One of four ways to present the currently playing title/artist over a
 * channel's hero artwork/visualizer — picked in Channel Designer, applied
 * to whatever the channel is actually playing (live broadcast or an
 * archive track), not just a static mockup. See
 * content/nowPlayingOverlayPresets.ts for the preset catalogue. */
export function NowPlayingOverlay({
  presetId,
  title,
  artist,
  artworkUrl,
  seekbar,
  compact = false,
  settings,
}: Props) {
  const overlayStyle = settings
    ? {
        transform: `translate(${settings.offsetX}px, ${settings.offsetY}px) scale(${settings.textScale})`,
        transformOrigin: 'center bottom',
        opacity: settings.opacity,
      }
    : undefined;
  const cover = artworkUrl ? (
    <MediaArtwork src={artworkUrl} alt="" size="fill" imageReveal={false} />
  ) : null;

  if (presetId === 'centered') {
    return (
      <div
        className="flex flex-col items-center gap-1 text-center"
        style={overlayStyle}
      >
        <div className="w-fit rounded-md bg-black/45 px-3 py-1 text-[10px] tracking-wide text-white/75 uppercase backdrop-blur-sm">
          Now playing
        </div>
        <div
          className={`mt-1 max-w-full truncate rounded-md bg-black/45 px-3 py-1.5 font-extrabold tracking-tight text-white backdrop-blur-sm ${
            compact ? 'text-base' : 'text-2xl sm:text-4xl'
          }`}
        >
          {title}
        </div>
        <div
          className={`max-w-full truncate font-medium text-white/85 ${
            compact ? 'text-xs' : 'text-base sm:text-xl'
          }`}
        >
          {artist}
        </div>
        {seekbar && <div className="mt-3 w-full max-w-2xl">{seekbar}</div>}
      </div>
    );
  }

  if (presetId === 'minimal') {
    return (
      <div className="flex flex-col items-start gap-2" style={overlayStyle}>
        <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-black/45 py-1.5 pr-3 pl-1.5 backdrop-blur-sm">
          <div
            className={`relative shrink-0 overflow-hidden rounded-full bg-white/10 ${
              compact ? 'size-4' : 'size-6'
            }`}
          >
            {cover}
          </div>
          <span
            className={`truncate font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {title}
          </span>
          <span className="text-white/50" aria-hidden>
            ·
          </span>
          <span
            className={`truncate text-white/70 ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {artist}
          </span>
        </div>
        {seekbar}
      </div>
    );
  }

  if (presetId === 'edge') {
    return (
      <div className="flex flex-col gap-1" style={overlayStyle}>
        <div className="flex items-end justify-between gap-4">
          <div
            className={`min-w-0 truncate font-extrabold tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)] ${
              compact ? 'text-base' : 'text-3xl sm:text-5xl'
            }`}
          >
            {title}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`hidden truncate text-right font-medium text-white/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] sm:block ${
                compact ? 'text-xs' : 'text-base sm:text-xl'
              }`}
            >
              {artist}
            </span>
            <div
              className={`relative shrink-0 overflow-hidden rounded-full bg-white/10 shadow-lg ring-2 ring-white/20 ${
                compact ? 'size-8' : 'size-12 sm:size-16'
              }`}
            >
              {cover}
            </div>
          </div>
        </div>
        <div
          className={`truncate font-medium text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)] sm:hidden ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {artist}
        </div>
        {seekbar}
      </div>
    );
  }

  // 'classic' — the original layout: cover thumbnail, stacked title/artist.
  return (
    <div className="flex flex-col gap-1" style={overlayStyle}>
      <div className={`flex items-end gap-3 ${compact ? '' : 'sm:gap-4'}`}>
        <div
          className={`relative hidden shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-lg ring-1 ring-white/15 sm:block ${
            compact ? 'sm:size-10' : 'sm:size-20'
          }`}
        >
          {cover}
        </div>
        <div className="min-w-0 flex-1">
          <div className="w-fit rounded-md bg-black/45 px-2.5 py-1 text-[10px] tracking-wide text-white/75 uppercase backdrop-blur-sm">
            Now playing
          </div>
          <div
            className={`mt-2 truncate rounded-md bg-black/45 px-2.5 py-1 font-extrabold tracking-tight text-white backdrop-blur-sm ${
              compact ? 'text-base' : 'text-3xl sm:text-5xl'
            }`}
          >
            {title}
          </div>
          <div
            className={`mt-1 w-fit max-w-full truncate rounded-md bg-black/45 px-2.5 py-1 font-medium text-white/85 backdrop-blur-sm ${
              compact ? 'text-xs' : 'text-lg sm:text-2xl'
            }`}
          >
            {artist}
          </div>
        </div>
      </div>
      {seekbar}
    </div>
  );
}
