import {
  BRAND_ACCENTS,
  isActiveTextOverlay,
  parseColorScheme,
  resolvePublicVisualizerPreset,
  type ChannelLookExtras,
} from '../../api/channel-design';
import { normalizeColorScheme } from '../../lib/colorScheme';
import type { ArtistChannelVisual } from './useArtistChannelLook';

/** Resolves the artist page's colour schemes and overlays; look extras win over the channel visual. */
export function artistLookSchemes(
  channelVisual: ArtistChannelVisual | null,
  lookExtras: ChannelLookExtras,
) {
  const headerScheme = normalizeColorScheme(
    channelVisual?.colorScheme ??
      parseColorScheme(channelVisual?.colorSchemeJson),
  );
  const playerScheme = lookExtras.usePlayerGradient
    ? normalizeColorScheme(parseColorScheme(lookExtras.playerColorSchemeJson))
    : headerScheme;
  const pageScheme = lookExtras.useBackgroundGradient
    ? normalizeColorScheme(
        parseColorScheme(lookExtras.backgroundColorSchemeJson),
      )
    : headerScheme;
  const playerOverlayMode =
    lookExtras.playerOverlayMode ?? channelVisual?.playerOverlayMode ?? null;
  const playerOverlayText =
    lookExtras.playerOverlayText ?? channelVisual?.playerOverlayText ?? null;

  return {
    headerScheme,
    playerScheme,
    pageScheme,
    artistBackdropUrl: channelVisual?.videoBackgroundUrl
      ? null
      : (channelVisual?.slideshowImages?.[0] ?? null),
    sectionSurfaceStyle: {
      backgroundColor: `${pageScheme.bg}e6`,
      borderColor: `${pageScheme.muted}66`,
      color: pageScheme.text,
    },
    playerStageGradient: `linear-gradient(to top, ${playerScheme.bg}cc, ${playerScheme.bg}59, ${playerScheme.bg}1a)`,
    playerBottomGradient: `linear-gradient(to top, ${playerScheme.bg}cc, ${playerScheme.bg}73, transparent)`,
    resolvedVisualizerPreset: channelVisual?.visualPreset
      ? resolvePublicVisualizerPreset(channelVisual.visualPreset)
      : undefined,
    backgroundVisualPreset:
      lookExtras.backgroundVisualPreset ??
      channelVisual?.backgroundVisualPreset ??
      null,
    brandGradient: BRAND_ACCENTS.find(
      (brand) => brand.id === channelVisual?.brandAccentPreset,
    )?.gradient,
    overlay: {
      show: isActiveTextOverlay({
        mode: playerOverlayMode,
        text: playerOverlayText,
      }),
      mode: playerOverlayMode,
      text: playerOverlayText,
      align:
        lookExtras.playerOverlayAlign ??
        channelVisual?.playerOverlayAlign ??
        null,
      styleId:
        lookExtras.nowPlayingOverlayStyle ??
        channelVisual?.nowPlayingOverlayStyle ??
        null,
      settingsJson:
        lookExtras.nowPlayingOverlaySettingsJson ??
        channelVisual?.nowPlayingOverlaySettingsJson ??
        null,
    },
  };
}
