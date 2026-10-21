import type {
  ChannelVisual,
  ChannelVisualPreset,
} from '../../api/channel-design';

/** The header/player fields a saved preset overrides on the current visual.
 * Fields the preset leaves out fall back to their defaults, except the ones
 * that keep the current value. */
export function applyPresetToVisual(
  v: ChannelVisual,
  s: ChannelVisualPreset['settings'],
): ChannelVisual {
  return {
    ...v,
    ...(s.visualPreset !== undefined ? { visualPreset: s.visualPreset } : {}),
    ...(s.headerStyle !== undefined ? { headerStyle: s.headerStyle } : {}),
    videoBackgroundUrl: s.videoBackgroundUrl ?? null,
    brandAccentPreset: s.brandAccentPreset ?? null,
    nowPlayingOverlayStyle:
      s.nowPlayingOverlayStyle ?? v.nowPlayingOverlayStyle,
    usePlayerGradient: s.usePlayerGradient ?? false,
    backgroundVisualPreset:
      s.backgroundVisualPreset ?? v.backgroundVisualPreset,
    useBackgroundGradient: s.useBackgroundGradient ?? false,
    channelLinks: s.channelLinks ?? [],
    textOverlayMode: s.textOverlayMode ?? 'NONE',
    textOverlayText: s.textOverlayText ?? '',
    textOverlayAlign: s.textOverlayAlign ?? 'CENTER',
    playerOverlayMode: s.playerOverlayMode ?? 'NONE',
    playerOverlayText: s.playerOverlayText ?? '',
    playerOverlayAlign: s.playerOverlayAlign ?? 'CENTER',
  };
}
