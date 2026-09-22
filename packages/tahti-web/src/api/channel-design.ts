export type {
  VisualPreset,
  BackgroundVisualPreset,
  TextOverlayMode,
  TextOverlayAlign,
  VisualPresetSettings,
  VisualSettingsMap,
} from './channel-design/presets';
export {
  VISUAL_PRESETS,
  isVisualPreset,
  PUBLIC_FALLBACK_VISUAL_PRESET,
  resolvePublicVisualizerPreset,
  BACKGROUND_VISUAL_PRESETS,
  isBackgroundVisualPreset,
  TEXT_OVERLAY_MODES,
  TEXT_OVERLAY_MODE_LABELS,
  TEXT_OVERLAY_ALIGNMENTS,
  TEXT_OVERLAY_ALIGN_LABELS,
  isActiveTextOverlay,
  DEFAULT_VISUAL_PRESET_SETTINGS,
  parseVisualSettingsMap,
  resolveVisualPresetSettings,
  shouldDockVisualizerTuning,
} from './channel-design/presets';
export type { HeaderStyle } from './channel-design/header';
export {
  HEADER_STYLES,
  isHeaderImageUrl,
  youtubeEmbedUrl,
  isValidHeaderVideoUrl,
  isValidHeaderBackdropUrl,
  MAX_HEADER_VIDEO_BYTES,
  uploadChannelHeaderVideo,
} from './channel-design/header';
export type {
  ColorScheme,
  LooseColorSchemeInput,
} from './channel-design/colors';
export {
  BRAND_ACCENTS,
  DEFAULT_COLOR_SCHEME,
  fillColorScheme,
  parseColorScheme,
} from './channel-design/colors';
export type { ChannelVisual, ChannelLink } from './channel-design/visual';
export {
  parseChannelLinksJson,
  normalizeChannelVisual,
} from './channel-design/visual';
export {
  getMockNowPlayingOverlayStyle,
  getMockNowPlayingOverlaySettingsJson,
  getMockUsePlayerGradient,
  getMockPlayerColorSchemeJson,
  getMockBackgroundVisualPreset,
  getMockUseBackgroundGradient,
  getMockBackgroundColorSchemeJson,
  getMockVisualPreset,
  getMockHeaderStyle,
  getMockVideoBackgroundUrl,
  getMockChannelColorScheme,
  getMockBrandAccentPreset,
  getMockVisualSettingsJson,
  getMockChannelLinks,
  getMockTextOverlay,
  getMockPlayerOverlay,
} from './channel-design/mock';
export type {
  ChannelVisualPatch,
  ChannelVisualApiPatch,
} from './channel-design/visual-api';
export {
  fetchChannelVisual,
  CHANNEL_VISUAL_API_PATCH_KEYS,
  toChannelVisualApiPatch,
} from './channel-design/visual-api';
export {
  mergeLookExtrasPreferApi,
  channelLookExtrasFromVisual,
  loadChannelLookExtras,
  saveChannelLookExtras,
  resolveChannelLookExtras,
  channelLookExtrasFromPatch,
} from './channel-design/look-extras';
export type { ChannelLookExtras } from './channel-design/look-extras';
export { patchChannelVisual } from './channel-design/patch';
export type { ChannelVisualPreset } from './channel-design/saved-presets';
export {
  fetchChannelVisualPresets,
  saveChannelVisualPreset,
  deleteChannelVisualPreset,
} from './channel-design/saved-presets';
export {
  checkSlugAvailable,
  updateChannelSlug,
  setCustomDomain,
  verifyCustomDomain,
} from './channel-design/domain';
