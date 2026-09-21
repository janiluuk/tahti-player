import type {
  ChannelVisual,
  ColorScheme,
  VisualPreset,
  VisualSettingsMap,
} from '../../api/channel-design';
import type { ChannelGalleryMode } from '../../api/channel-gallery';
import type { NowPlayingOverlaySettings } from '../../content/nowPlayingOverlayPresets';

/** Everything "Save layout" persists — captured before each save so a
 * "Restore" action can undo it. In-memory only (per the branch's own
 * design intent): lost on reload, not a durable version history. */
export type LookSnapshot = {
  visual: ChannelVisual;
  scheme: ColorScheme;
  playerScheme: ColorScheme;
  backgroundScheme: ColorScheme;
  visualSettings: VisualSettingsMap;
  galleryMode: ChannelGalleryMode;
  galleryImages: string;
  videoBackgroundUrl: string;
  slideshowPreset: string;
  slideshowInterval: number;
  slideshowTransition: number;
  slideshowAutoplay: boolean;
  overlaySettings: NowPlayingOverlaySettings;
  previewPreset: VisualPreset;
};
