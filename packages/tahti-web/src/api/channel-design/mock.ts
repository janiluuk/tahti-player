import { fillColorScheme, parseColorScheme, type ColorScheme } from './colors';
import { type ChannelLink, type ChannelVisual } from './visual';

export let mockVisual: ChannelVisual = {
  visualPreset: 'AURORA',
  colorSchemeJson: JSON.stringify({
    accent: '#22D3EE',
    highlight: '#A78BFA',
    bg: '#0B1220',
    text: '#F8FAFC',
    muted: '#64748B',
  }),
  headerStyle: 'GRADIENT',
  videoBackgroundUrl: null,
  brandAccentPreset: 'aurora',
  slideshowPreset: 'FADE',
  slideshowIntervalSeconds: 8,
  slideshowTransitionMs: 600,
  slideshowAutoplay: true,
  nowPlayingOverlayStyle: 'classic',
  nowPlayingOverlaySettingsJson: null,
  usePlayerGradient: false,
  playerColorSchemeJson: null,
  backgroundVisualPreset: 'INTERACTIVE_POINTS',
  useBackgroundGradient: false,
  backgroundColorSchemeJson: null,
  channelLinks: [],
  textOverlayMode: 'NONE',
  textOverlayText: '',
  textOverlayAlign: 'CENTER',
  playerOverlayMode: 'NONE',
  playerOverlayText: '',
  playerOverlayAlign: 'CENTER',
};

export function setMockVisual(next: ChannelVisual): void {
  mockVisual = next;
}

/** Read-only peek at the mock design state — used by mockChannel() (in
 * api/mock.ts) so a channel's PUBLIC page reflects the owner's saved
 * now-playing overlay choice under VITE_FORCE_MOCK, the same way it would
 * once a real Channel.nowPlayingOverlayStyle column exists. */
export function getMockNowPlayingOverlayStyle(): string | null | undefined {
  return mockVisual.nowPlayingOverlayStyle;
}

export function getMockNowPlayingOverlaySettingsJson():
  string | null | undefined {
  return mockVisual.nowPlayingOverlaySettingsJson;
}

/** Same "wired to the artist's saved Channel Designer pick under
 * VITE_FORCE_MOCK" pattern as the now-playing getters above. */
export function getMockUsePlayerGradient(): boolean | undefined {
  return mockVisual.usePlayerGradient;
}

export function getMockPlayerColorSchemeJson(): string | null | undefined {
  return mockVisual.playerColorSchemeJson;
}

export function getMockBackgroundVisualPreset(): string | null | undefined {
  return mockVisual.backgroundVisualPreset;
}

export function getMockUseBackgroundGradient(): boolean | undefined {
  return mockVisual.useBackgroundGradient;
}

export function getMockBackgroundColorSchemeJson(): string | null | undefined {
  return mockVisual.backgroundColorSchemeJson;
}

export function getMockVisualPreset(): string {
  return mockVisual.visualPreset;
}

export function getMockHeaderStyle(): string {
  return mockVisual.headerStyle;
}

export function getMockVideoBackgroundUrl(): string | null {
  return mockVisual.videoBackgroundUrl ?? null;
}

export function getMockChannelColorScheme(): Required<ColorScheme> {
  return fillColorScheme(parseColorScheme(mockVisual.colorSchemeJson));
}

export function getMockBrandAccentPreset(): string | null {
  return mockVisual.brandAccentPreset ?? null;
}

export function getMockVisualSettingsJson(): string | null {
  return mockVisual.visualSettingsJson ?? null;
}

export function getMockChannelLinks(): ChannelLink[] {
  return mockVisual.channelLinks ?? [];
}

export function getMockTextOverlay(): {
  mode: string | null | undefined;
  text: string | null | undefined;
  align: string | null | undefined;
} {
  return {
    mode: mockVisual.textOverlayMode,
    text: mockVisual.textOverlayText,
    align: mockVisual.textOverlayAlign,
  };
}

export function getMockPlayerOverlay(): {
  mode: string | null | undefined;
  text: string | null | undefined;
  align: string | null | undefined;
} {
  return {
    mode: mockVisual.playerOverlayMode,
    text: mockVisual.playerOverlayText,
    align: mockVisual.playerOverlayAlign,
  };
}
