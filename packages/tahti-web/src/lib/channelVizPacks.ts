import type { TFunction } from '@tahti-player/i18n';
import type { VisualizerMode } from '@tahti-player/visualizer';

import {
  isValidHeaderBackdropUrl,
  type VisualSettingsMap,
} from '../api/channel-design';
import { webT } from './webT';

export type ChannelVizPack = {
  id: string;
  label: string;
  description: string;
  /** Played in order; the first is the one a listener sees on arrival. */
  modes: readonly VisualizerMode[];
  rotateSeconds: number;
};

export function channelVizPacks(
  t: TFunction<'web'>,
): readonly ChannelVizPack[] {
  return [
    {
      id: 'club-night',
      label: t('channelVizPacks.clubNight'),
      description: t('channelVizPacks.spectrumRadialAndLatticeScenes'),
      modes: ['spectrum', 'radial', 'quantum'],
      rotateSeconds: 45,
    },
    {
      id: 'deep-listening',
      label: t('channelVizPacks.deepListening'),
      description: t('channelVizPacks.slowCymaticsAndAGlowing'),
      modes: ['cymatics', 'orb'],
      rotateSeconds: 90,
    },
    {
      id: 'chrome-drive',
      label: t('channelVizPacks.chromeDrive'),
      description: t('channelVizPacks.aChromeLandscapeWithAn'),
      modes: ['landscape-chrome', 'oscilloscope'],
      rotateSeconds: 60,
    },
    {
      id: 'liquid-metal',
      label: t('channelVizPacks.liquidMetal'),
      description: t('channelVizPacks.ferrofluidTerrainAndCymaticsFor'),
      modes: ['landscape-ferrofluid', 'cymatics'],
      rotateSeconds: 60,
    },
    {
      id: 'signal-lab',
      label: t('channelVizPacks.signalLab'),
      description: t('channelVizPacks.oscilloscopeAndSpectrumOnlyNo'),
      modes: ['oscilloscope', 'spectrum'],
      rotateSeconds: 120,
    },
  ];
}

/** The API has no field for a pack, so the choice rides in the channel's
 * `visualSettings` map (free string keys, partial settings values) under
 * this prefix with an empty settings object. */
const VIZ_PACK_KEY_PREFIX = 'pack:';

export function channelVizPack(
  id: string | null | undefined,
): ChannelVizPack | null {
  return id
    ? (channelVizPacks(webT()).find((pack) => pack.id === id) ?? null)
    : null;
}

function isVizPackKey(key: string): boolean {
  return key.startsWith(VIZ_PACK_KEY_PREFIX);
}

/** First known pack key wins; keys for packs this build doesn't know are
 * ignored so an older client never shows a blank label. */
export function channelVizPackId(map: VisualSettingsMap): string | null {
  for (const key of Object.keys(map)) {
    if (!isVizPackKey(key)) {
      continue;
    }
    const id = key.slice(VIZ_PACK_KEY_PREFIX.length);
    if (channelVizPacks(webT()).some((pack) => pack.id === id)) {
      return id;
    }
  }
  return null;
}

export function withChannelVizPack(
  map: VisualSettingsMap,
  packId: string | null,
): VisualSettingsMap {
  const next: VisualSettingsMap = {};
  for (const [key, value] of Object.entries(map)) {
    if (!isVizPackKey(key)) {
      next[key] = value;
    }
  }
  if (channelVizPack(packId)) {
    next[`${VIZ_PACK_KEY_PREFIX}${packId}`] = {};
  }
  return next;
}

function parseMap(json: string | null | undefined): VisualSettingsMap {
  if (!json) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as VisualSettingsMap)
      : {};
  } catch {
    return {};
  }
}

export function channelVizPackFromJson(
  json: string | null | undefined,
): ChannelVizPack | null {
  return channelVizPack(channelVizPackId(parseMap(json)));
}

/** True when the map holds real per-preset tuning, not only a pack choice. */
export function hasPresetTuning(json: string | null | undefined): boolean {
  return Object.keys(parseMap(json)).some((key) => !isVizPackKey(key));
}

export function vizPackModeAt(
  pack: ChannelVizPack,
  elapsedMs: number,
): VisualizerMode {
  const stepMs = Math.max(1, pack.rotateSeconds) * 1000;
  const step = Math.floor(Math.max(0, elapsedMs) / stepMs);
  return pack.modes[step % pack.modes.length];
}

type HeaderInput = {
  headerStyle?: string | null;
  videoBackgroundUrl?: string | null;
  galleryMode?: string | null;
  slideshowImages?: readonly string[] | null;
};

/** Mirrors ChannelBackdropCard's background order: a valid video/image,
 * solid, slideshow and gradient headers all cover the visualizer. */
export function channelHeaderShowsVisualizer(channel: HeaderInput): boolean {
  const style = channel.headerStyle ?? 'GRADIENT';
  if (
    style === 'VIDEO_LOOP' &&
    isValidHeaderBackdropUrl(channel.videoBackgroundUrl)
  ) {
    return false;
  }
  if (style === 'SOLID' || style === 'GRADIENT') {
    return false;
  }
  return !(
    channel.galleryMode === 'STATIC_SLIDESHOW' &&
    Boolean(channel.slideshowImages?.[0])
  );
}
