import {
  fillColorScheme,
  type ChannelVisual,
  type ChannelVisualPatch,
  type ColorScheme,
  type VisualSettingsMap,
} from '../../api/channel-design';
import type { NowPlayingOverlaySettings } from '../../content/nowPlayingOverlayPresets';

export type VisualPatchDraft = {
  visual: ChannelVisual | null;
  scheme: ColorScheme;
  playerScheme: ColorScheme;
  backgroundScheme: ColorScheme;
  visualSettings: VisualSettingsMap;
  slideshowPreset: string;
  slideshowInterval: number;
  slideshowTransition: number;
  slideshowAutoplay: boolean;
  overlaySettings: NowPlayingOverlaySettings;
};

/** Everything the "Look" currently holds, as one patch — sent to save, and
 * (with the current, not-yet-uploaded backdrop URL) snapshotted as-is when
 * saving a named preset. Null until the visual has loaded. */
export function buildVisualPatch(
  draft: VisualPatchDraft,
  videoUrl: string | null,
): ChannelVisualPatch | null {
  const { visual } = draft;
  if (!visual) {
    return null;
  }
  return {
    visualPreset: visual.visualPreset,
    headerStyle: visual.headerStyle,
    videoBackgroundUrl: videoUrl,
    brandAccentPreset: visual.brandAccentPreset,
    topBarText: visual.topBarText?.trim() || null,
    colorScheme: fillColorScheme(draft.scheme),
    visualSettings: draft.visualSettings,
    slideshowPreset: draft.slideshowPreset,
    slideshowIntervalSeconds: draft.slideshowInterval,
    slideshowTransitionMs: draft.slideshowTransition,
    slideshowAutoplay: draft.slideshowAutoplay,
    nowPlayingOverlayStyle: visual.nowPlayingOverlayStyle ?? undefined,
    nowPlayingOverlaySettingsJson: JSON.stringify(draft.overlaySettings),
    usePlayerGradient: visual.usePlayerGradient ?? false,
    playerColorSchemeJson: visual.usePlayerGradient
      ? JSON.stringify(fillColorScheme(draft.playerScheme))
      : null,
    backgroundVisualPreset: visual.backgroundVisualPreset ?? undefined,
    useBackgroundGradient: visual.useBackgroundGradient ?? false,
    backgroundColorSchemeJson: visual.useBackgroundGradient
      ? JSON.stringify(fillColorScheme(draft.backgroundScheme))
      : null,
    channelLinks: visual.channelLinks ?? [],
    textOverlayMode: visual.textOverlayMode ?? 'NONE',
    textOverlayText: visual.textOverlayText ?? '',
    textOverlayAlign: visual.textOverlayAlign ?? 'CENTER',
    playerOverlayMode: visual.playerOverlayMode ?? 'NONE',
    playerOverlayText: visual.playerOverlayText ?? '',
    playerOverlayAlign: visual.playerOverlayAlign ?? 'CENTER',
  };
}
