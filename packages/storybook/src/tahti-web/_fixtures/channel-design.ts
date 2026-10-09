import type {
  ChannelLink,
  ChannelVisual,
  ChannelVisualPreset,
  ColorScheme,
} from '@tahti-web/api/channel-design';
import { deleteChannelVisualPreset } from '@tahti-web/api/channel-design';
import { lookExtrasStorageKey } from '@tahti-web/api/channel-design/look-extras';
import { mockVisual, setMockVisual } from '@tahti-web/api/channel-design/mock';
import { mockVisualPresets } from '@tahti-web/api/channel-design/saved-presets';
import type { ChannelPageItem } from '@tahti-web/lib/channelPageLayout';

import { mockData } from '../_lib/mock-data';

export const DESIGN_SLUG = 'northern-lights';

export const DESIGN_SCHEME: Required<ColorScheme> = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

export const DESIGN_LINKS: ChannelLink[] = [
  { label: 'Bandcamp', url: 'https://northernlights.bandcamp.com' },
  { label: 'Instagram', url: 'https://instagram.com/northernlights.live' },
  {
    label: 'SoundCloud',
    url: 'https://soundcloud.com/northern-lights',
    hidden: true,
  },
];

/** The owner's saved look: Aurora visualizer over a gradient header, a top
 * bar line, tuned visualizer settings and a player overlay. */
export const DESIGN_VISUAL: ChannelVisual = {
  visualPreset: 'AURORA',
  colorSchemeJson: JSON.stringify(DESIGN_SCHEME),
  visualSettingsJson: JSON.stringify({
    AURORA: { speed: 1.25, intensity: 0.8, audioReactive: true },
  }),
  headerStyle: 'GRADIENT',
  videoBackgroundUrl: null,
  brandAccentPreset: 'aurora',
  topBarText: 'New album "Polar Drift" out Friday',
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
  channelLinks: DESIGN_LINKS,
  textOverlayMode: 'NONE',
  textOverlayText: '',
  textOverlayAlign: 'CENTER',
  playerOverlayMode: 'COSMIC_NEON',
  playerOverlayText: 'Live from Helsinki',
  playerOverlayAlign: 'CENTER',
};

export const DESIGN_PRESETS: ChannelVisualPreset[] = [
  {
    id: 'preset-ember-dusk',
    name: 'Ember dusk',
    settings: {
      visualPreset: 'WAVEFORM_BARS',
      headerStyle: 'SOLID',
      brandAccentPreset: 'ember',
      colorScheme: {
        accent: '#F97316',
        highlight: '#FBBF24',
        bg: '#120B08',
        text: '#FFF7ED',
        muted: '#78716C',
      },
    },
    createdAt: '2026-09-12T18:00:00.000Z',
    updatedAt: '2026-09-12T18:00:00.000Z',
  },
  {
    id: 'preset-violet-hour',
    name: 'Violet hour',
    settings: {
      visualPreset: 'PARTICLE_FIELD',
      headerStyle: 'GRADIENT',
      brandAccentPreset: 'violet',
      colorScheme: {
        accent: '#A855F7',
        highlight: '#EC4899',
        bg: '#140A1F',
        text: '#FAF5FF',
        muted: '#6B7280',
      },
    },
    createdAt: '2026-08-30T21:30:00.000Z',
    updatedAt: '2026-08-30T21:30:00.000Z',
  },
];

/** Channel page layout with every identity toggle row present, as
 * ChannelView's editing mode passes it to the designer. */
export function designLayout(): ChannelPageItem[] {
  return [
    { id: 'hero', type: 'hero', visible: true },
    { id: 'sound', type: 'sound', visible: true },
    { id: 'avatar', type: 'avatar', visible: true },
    { id: 'about', type: 'about', visible: true },
    { id: 'subscribe', type: 'subscribe', visible: false },
    { id: 'links', type: 'links', visible: true },
    { id: 'events', type: 'events', visible: true, width: 'wide' },
    {
      id: 'playlist-favorites-vault',
      type: 'playlist',
      playlistSlug: 'favorites-vault',
      visible: true,
    },
    { id: 'feed', type: 'feed', visible: true, feedDisplay: 'cards' },
    {
      id: 'navigation',
      type: 'navigation',
      visible: true,
      navigationTabs: [
        { id: 'tab-stage', label: 'Stage', itemIds: ['sound', 'events'] },
        {
          id: 'tab-music',
          label: 'Music',
          itemIds: ['playlist-favorites-vault'],
        },
      ],
    },
    { id: 'chat', type: 'chat', visible: false },
  ];
}

/** Seeds the designer's look and saved presets through `parameters.mockData`. */
export const channelDesignMockData = (
  presets: ChannelVisualPreset[] = DESIGN_PRESETS,
) =>
  mockData({
    channelVisual: () => ({ ...DESIGN_VISUAL }),
    channelVisualPresets: (base) => [...presets, ...base],
  });

/**
 * Story `beforeEach` for plays that save: the mock save path writes module
 * state (the saved look, saved presets) and localStorage, so put all three
 * back afterwards and leave no trace for the next story.
 */
export function restoreChannelDesignState() {
  const visualBefore = { ...mockVisual };
  const presetIdsBefore = new Set(mockVisualPresets.map((p) => p.id));
  const storageKeys = [
    lookExtrasStorageKey(DESIGN_SLUG),
    `tahti.artistLookBlocks.${DESIGN_SLUG}`,
    `tahti.channelPageLayout.${DESIGN_SLUG}`,
  ];
  for (const key of storageKeys) {
    localStorage.removeItem(key);
  }
  return async () => {
    setMockVisual(visualBefore);
    for (const preset of [...mockVisualPresets]) {
      if (!presetIdsBefore.has(preset.id)) {
        await deleteChannelVisualPreset(preset.id);
      }
    }
    for (const key of storageKeys) {
      localStorage.removeItem(key);
    }
  };
}
