import { type ChannelLink, type ChannelVisual } from './visual';
import { type ChannelVisualPatch } from './visual-api';

export type ChannelLookExtras = Pick<
  ChannelVisual,
  | 'nowPlayingOverlayStyle'
  | 'nowPlayingOverlaySettingsJson'
  | 'usePlayerGradient'
  | 'playerColorSchemeJson'
  | 'backgroundVisualPreset'
  | 'useBackgroundGradient'
  | 'backgroundColorSchemeJson'
  | 'channelLinks'
  | 'textOverlayMode'
  | 'textOverlayText'
  | 'textOverlayAlign'
  | 'playerOverlayMode'
  | 'playerOverlayText'
  | 'playerOverlayAlign'
>;

export function lookExtrasStorageKey(slug: string) {
  return `tahti.channelLookExtras.${slug}`;
}

export const CHANNEL_LOOK_EXTRA_KEYS = [
  'nowPlayingOverlayStyle',
  'nowPlayingOverlaySettingsJson',
  'usePlayerGradient',
  'playerColorSchemeJson',
  'backgroundVisualPreset',
  'useBackgroundGradient',
  'backgroundColorSchemeJson',
  'channelLinks',
  'textOverlayMode',
  'textOverlayText',
  'textOverlayAlign',
  'playerOverlayMode',
  'playerOverlayText',
  'playerOverlayAlign',
] as const satisfies ReadonlyArray<keyof ChannelLookExtras>;

/** API/public fields win whenever they are present (including `null` / `false`).
 * Cache only fills keys the live payload still omits. */
export function mergeLookExtrasPreferApi(
  api: ChannelLookExtras,
  cache: ChannelLookExtras,
): ChannelLookExtras {
  const merged: ChannelLookExtras = { ...cache };
  for (const key of CHANNEL_LOOK_EXTRA_KEYS) {
    if (api[key] !== undefined) {
      (merged as Record<string, unknown>)[key] = api[key];
    }
  }
  return merged;
}

export function channelLookExtrasFromVisual(
  visual:
    | {
        nowPlayingOverlayStyle?: string | null;
        nowPlayingOverlaySettingsJson?: string | null;
        usePlayerGradient?: boolean;
        playerColorSchemeJson?: string | null;
        backgroundVisualPreset?: string | null;
        useBackgroundGradient?: boolean;
        backgroundColorSchemeJson?: string | null;
        channelLinks?: ChannelLink[] | null;
        textOverlayMode?: string | null;
        textOverlayText?: string | null;
        textOverlayAlign?: string | null;
        playerOverlayMode?: string | null;
        playerOverlayText?: string | null;
        playerOverlayAlign?: string | null;
      }
    | null
    | undefined,
): ChannelLookExtras {
  if (!visual) {
    return {};
  }
  return {
    ...(visual.nowPlayingOverlayStyle !== undefined
      ? { nowPlayingOverlayStyle: visual.nowPlayingOverlayStyle }
      : {}),
    ...(visual.nowPlayingOverlaySettingsJson !== undefined
      ? { nowPlayingOverlaySettingsJson: visual.nowPlayingOverlaySettingsJson }
      : {}),
    ...(visual.usePlayerGradient !== undefined
      ? { usePlayerGradient: visual.usePlayerGradient }
      : {}),
    ...(visual.playerColorSchemeJson !== undefined
      ? { playerColorSchemeJson: visual.playerColorSchemeJson }
      : {}),
    ...(visual.backgroundVisualPreset !== undefined
      ? { backgroundVisualPreset: visual.backgroundVisualPreset }
      : {}),
    ...(visual.useBackgroundGradient !== undefined
      ? { useBackgroundGradient: visual.useBackgroundGradient }
      : {}),
    ...(visual.backgroundColorSchemeJson !== undefined
      ? { backgroundColorSchemeJson: visual.backgroundColorSchemeJson }
      : {}),
    ...(visual.channelLinks !== undefined
      ? { channelLinks: visual.channelLinks }
      : {}),
    ...(visual.textOverlayMode !== undefined
      ? { textOverlayMode: visual.textOverlayMode }
      : {}),
    ...(visual.textOverlayText !== undefined
      ? { textOverlayText: visual.textOverlayText }
      : {}),
    ...(visual.textOverlayAlign !== undefined
      ? { textOverlayAlign: visual.textOverlayAlign }
      : {}),
    ...(visual.playerOverlayMode !== undefined
      ? { playerOverlayMode: visual.playerOverlayMode }
      : {}),
    ...(visual.playerOverlayText !== undefined
      ? { playerOverlayText: visual.playerOverlayText }
      : {}),
    ...(visual.playerOverlayAlign !== undefined
      ? { playerOverlayAlign: visual.playerOverlayAlign }
      : {}),
  };
}

export function loadChannelLookExtras(slug: string): ChannelLookExtras {
  if (!slug) {
    return {};
  }
  try {
    const raw = localStorage.getItem(lookExtrasStorageKey(slug));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as ChannelLookExtras;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChannelLookExtras(
  slug: string,
  extras: ChannelLookExtras,
): void {
  if (!slug) {
    return;
  }
  const current = loadChannelLookExtras(slug);
  localStorage.setItem(
    lookExtrasStorageKey(slug),
    JSON.stringify({ ...current, ...extras }),
  );
}

/** Resolve look extras for a public channel / designer visual: live fields
 * first, localStorage only for keys the payload still omits. */
export function resolveChannelLookExtras(
  slug: string,
  api: ChannelLookExtras,
): ChannelLookExtras {
  return mergeLookExtrasPreferApi(api, loadChannelLookExtras(slug));
}

export function channelLookExtrasFromPatch(
  patch: ChannelVisualPatch,
): ChannelLookExtras {
  return {
    ...(patch.nowPlayingOverlayStyle !== undefined
      ? { nowPlayingOverlayStyle: patch.nowPlayingOverlayStyle }
      : {}),
    ...(patch.nowPlayingOverlaySettingsJson !== undefined
      ? { nowPlayingOverlaySettingsJson: patch.nowPlayingOverlaySettingsJson }
      : {}),
    ...(patch.usePlayerGradient !== undefined
      ? { usePlayerGradient: patch.usePlayerGradient }
      : {}),
    ...(patch.playerColorSchemeJson !== undefined
      ? { playerColorSchemeJson: patch.playerColorSchemeJson }
      : {}),
    ...(patch.backgroundVisualPreset !== undefined
      ? { backgroundVisualPreset: patch.backgroundVisualPreset }
      : {}),
    ...(patch.useBackgroundGradient !== undefined
      ? { useBackgroundGradient: patch.useBackgroundGradient }
      : {}),
    ...(patch.backgroundColorSchemeJson !== undefined
      ? { backgroundColorSchemeJson: patch.backgroundColorSchemeJson }
      : {}),
    ...(patch.channelLinks !== undefined
      ? { channelLinks: patch.channelLinks }
      : {}),
    ...(patch.textOverlayMode !== undefined
      ? { textOverlayMode: patch.textOverlayMode }
      : {}),
    ...(patch.textOverlayText !== undefined
      ? { textOverlayText: patch.textOverlayText }
      : {}),
    ...(patch.textOverlayAlign !== undefined
      ? { textOverlayAlign: patch.textOverlayAlign }
      : {}),
    ...(patch.playerOverlayMode !== undefined
      ? { playerOverlayMode: patch.playerOverlayMode }
      : {}),
    ...(patch.playerOverlayText !== undefined
      ? { playerOverlayText: patch.playerOverlayText }
      : {}),
    ...(patch.playerOverlayAlign !== undefined
      ? { playerOverlayAlign: patch.playerOverlayAlign }
      : {}),
  };
}
