import type { TFunction } from '@tahti-player/i18n';

import { webT } from '../lib/webT';

/** Layout variations for the "now playing" title/artist text overlay shown
 * on a channel's hero (live broadcast or any archive track played from that
 * channel) — see NowPlayingOverlay.tsx for the actual rendering of each. */

export type NowPlayingOverlayPresetId =
  'classic' | 'centered' | 'minimal' | 'edge';

export type NowPlayingOverlayPreset = {
  id: NowPlayingOverlayPresetId;
  name: string;
  description: string;
};

export type NowPlayingOverlaySettings = {
  textScale: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

export const DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS: NowPlayingOverlaySettings = {
  textScale: 1,
  offsetX: 0,
  offsetY: 0,
  opacity: 1,
};

export function parseNowPlayingOverlaySettings(
  json: string | null | undefined,
): NowPlayingOverlaySettings {
  if (!json) {
    return { ...DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS };
  }
  try {
    const parsed = JSON.parse(json) as Partial<NowPlayingOverlaySettings>;
    return {
      textScale:
        parsed.textScale ?? DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS.textScale,
      offsetX: parsed.offsetX ?? DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS.offsetX,
      offsetY: parsed.offsetY ?? DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS.offsetY,
      opacity: parsed.opacity ?? DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS.opacity,
    };
  } catch {
    return { ...DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS };
  }
}

export function nowPlayingOverlayPresets(
  t: TFunction<'web'>,
): NowPlayingOverlayPreset[] {
  return [
    {
      id: 'classic',
      name: 'Classic',
      description: t('nowPlayingOverlayPresets.coverThumbnailWithStackedTitle'),
    },
    {
      id: 'centered',
      name: 'Centered',
      description: t('nowPlayingOverlayPresets.titleAndArtistCenteredTogether'),
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: t('nowPlayingOverlayPresets.oneCompactLineLetsThe'),
    },
    {
      id: 'edge',
      name: 'Edge',
      description: t('nowPlayingOverlayPresets.titleBottomLeftArtistBottom'),
    },
  ];
}

export const DEFAULT_NOW_PLAYING_OVERLAY_PRESET: NowPlayingOverlayPresetId =
  'classic';

export function isNowPlayingOverlayPreset(
  value: string | null | undefined,
): value is NowPlayingOverlayPresetId {
  return (
    !!value &&
    nowPlayingOverlayPresets(webT()).some((preset) => preset.id === value)
  );
}

export function resolveNowPlayingOverlayPreset(
  value: string | null | undefined,
): NowPlayingOverlayPresetId {
  return isNowPlayingOverlayPreset(value)
    ? value
    : DEFAULT_NOW_PLAYING_OVERLAY_PRESET;
}
