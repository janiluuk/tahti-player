import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockVisual, setMockVisual } from './mock';
import { normalizeChannelVisual, type ChannelVisual } from './visual';
import { toChannelVisualApiPatch, type ChannelVisualPatch } from './visual-api';

export async function patchChannelVisual(
  patch: ChannelVisualPatch,
): Promise<{ ok: true; data: ChannelVisual } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockVisual({
      ...mockVisual,
      ...(patch.visualPreset !== undefined
        ? { visualPreset: patch.visualPreset }
        : {}),
      ...(patch.headerStyle !== undefined
        ? { headerStyle: patch.headerStyle }
        : {}),
      ...(patch.videoBackgroundUrl !== undefined
        ? { videoBackgroundUrl: patch.videoBackgroundUrl }
        : {}),
      ...(patch.brandAccentPreset !== undefined
        ? { brandAccentPreset: patch.brandAccentPreset }
        : {}),
      ...(patch.topBarText !== undefined
        ? { topBarText: patch.topBarText }
        : {}),
      ...(patch.slideshowPreset !== undefined
        ? { slideshowPreset: patch.slideshowPreset }
        : {}),
      ...(patch.slideshowIntervalSeconds !== undefined
        ? { slideshowIntervalSeconds: patch.slideshowIntervalSeconds }
        : {}),
      ...(patch.slideshowTransitionMs !== undefined
        ? { slideshowTransitionMs: patch.slideshowTransitionMs }
        : {}),
      ...(patch.slideshowAutoplay !== undefined
        ? { slideshowAutoplay: patch.slideshowAutoplay }
        : {}),
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
      ...(patch.colorScheme !== undefined
        ? {
            colorSchemeJson: patch.colorScheme
              ? JSON.stringify(patch.colorScheme)
              : null,
          }
        : {}),
      ...(patch.visualSettings !== undefined
        ? {
            visualSettingsJson:
              patch.visualSettings &&
              Object.keys(patch.visualSettings).length > 0
                ? JSON.stringify(patch.visualSettings)
                : null,
          }
        : {}),
    });
    return { ok: true, data: { ...mockVisual } };
  }
  try {
    const { data } = await requestJson<
      ChannelVisual & { channelLinksJson?: string | null }
    >('/api/me/channel/visual', {
      method: 'PATCH',
      body: JSON.stringify(toChannelVisualApiPatch(patch)),
    });
    const textLayerTouched =
      patch.textOverlayMode !== undefined ||
      patch.textOverlayText !== undefined ||
      patch.textOverlayAlign !== undefined;
    if (textLayerTouched) {
      try {
        await requestJson('/api/me/channel/text-layer', {
          method: 'PATCH',
          body: JSON.stringify({
            ...(patch.textOverlayMode !== undefined
              ? { textLayerMode: patch.textOverlayMode }
              : {}),
            ...(patch.textOverlayText !== undefined
              ? { textLayerText: patch.textOverlayText }
              : {}),
            ...(patch.textOverlayAlign !== undefined
              ? { textLayerAlign: patch.textOverlayAlign }
              : {}),
          }),
        });
      } catch {
        // Visual save already succeeded; text layer is best-effort until
        // designer stores exclusively against the text-layer route.
      }
    }
    return {
      ok: true,
      data: normalizeChannelVisual({
        ...data,
        ...(patch.textOverlayMode !== undefined
          ? { textOverlayMode: patch.textOverlayMode }
          : {}),
        ...(patch.textOverlayText !== undefined
          ? { textOverlayText: patch.textOverlayText }
          : {}),
        ...(patch.textOverlayAlign !== undefined
          ? { textOverlayAlign: patch.textOverlayAlign }
          : {}),
        ...(patch.channelLinks !== undefined
          ? { channelLinks: patch.channelLinks }
          : {}),
      }),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
