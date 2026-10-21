import {
  channelLookExtrasFromVisual,
  isVisualPreset,
  mergeLookExtrasPreferApi,
  parseColorScheme,
  parseVisualSettingsMap,
  type ChannelLookExtras,
  type ChannelVisual,
} from '../../api/channel-design';
import type { ChannelGallery } from '../../api/channel-gallery';
import { parseNowPlayingOverlaySettings } from '../../content/nowPlayingOverlayPresets';
import type { LookSnapshot } from './lookSnapshot';

export type LoadedLook = {
  /** The server state as saved — also the baseline for "Restore". */
  snapshot: LookSnapshot;
  /** What the designer shows: the snapshot's visual with an invalid preset
   * corrected. */
  shownVisual: ChannelVisual;
  /** A corrected (invalid) preset is an unsaved change. */
  presetNeedsCorrection: boolean;
};

/** Turns the server's visual + gallery responses (and any locally cached
 * look extras) into the designer's draft state. */
export function buildLoadedLook(
  visualData: ChannelVisual,
  galleryData: ChannelGallery,
  localExtras: ChannelLookExtras,
): LoadedLook {
  const extras = mergeLookExtrasPreferApi(
    channelLookExtrasFromVisual(visualData),
    localExtras,
  );
  const merged: ChannelVisual = { ...visualData, ...extras };
  const presetNeedsCorrection =
    !isVisualPreset(merged.visualPreset) || merged.visualPreset === 'MINIMAL';
  const previewPreset =
    isVisualPreset(merged.visualPreset) && merged.visualPreset !== 'MINIMAL'
      ? merged.visualPreset
      : 'AURORA';
  return {
    presetNeedsCorrection,
    shownVisual: presetNeedsCorrection
      ? { ...merged, visualPreset: 'AURORA' }
      : merged,
    snapshot: {
      visual: merged,
      scheme: parseColorScheme(merged.colorSchemeJson),
      playerScheme: parseColorScheme(merged.playerColorSchemeJson),
      backgroundScheme: parseColorScheme(merged.backgroundColorSchemeJson),
      visualSettings: parseVisualSettingsMap(visualData.visualSettingsJson),
      galleryMode: galleryData.galleryMode,
      galleryImages: galleryData.slideshowImages.join('\n'),
      videoBackgroundUrl: galleryData.videoBackgroundUrl ?? '',
      slideshowPreset: visualData.slideshowPreset ?? 'FADE',
      slideshowInterval: visualData.slideshowIntervalSeconds ?? 8,
      slideshowTransition: visualData.slideshowTransitionMs ?? 600,
      slideshowAutoplay: visualData.slideshowAutoplay ?? true,
      overlaySettings: parseNowPlayingOverlaySettings(
        merged.nowPlayingOverlaySettingsJson,
      ),
      previewPreset,
    },
  };
}
