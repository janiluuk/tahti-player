import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  BACKGROUND_VISUAL_PRESETS,
  BRAND_ACCENTS,
  CHANNEL_VISUAL_API_PATCH_KEYS,
  HEADER_STYLES,
  TEXT_OVERLAY_ALIGN_LABELS,
  TEXT_OVERLAY_ALIGNMENTS,
  TEXT_OVERLAY_MODE_LABELS,
  TEXT_OVERLAY_MODES,
  toChannelVisualApiPatch,
  VISUAL_PRESETS,
  type ChannelVisual,
} from '../../api/channel-design';
import {
  DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  NOW_PLAYING_OVERLAY_PRESETS,
} from '../../content/nowPlayingOverlayPresets';
import { visualizerPresets } from '../../plugins/visualizers';
import { visualizerMetadata } from '../../plugins/visualizers/meta';
import { ChannelTextOverlayView } from '../ChannelTextOverlayView';
import { NowPlayingOverlay } from '../NowPlayingOverlay';
import { CSS_SLIDESHOW_PRESETS } from '../visuals/slideshowTransitions/CssCrossfadeTransition';
import { WEBGL_SLIDESHOW_PRESETS } from '../visuals/slideshowTransitions/WebglSlideshowTransition';
import { buildVisualPatch } from './buildVisualPatch';
import { resolveHeaderDesignMode } from './HeaderStyleTabs';
import { SLIDESHOW_PRESETS } from './slideshowOptions';

/** Every option the designer offers must be understood by the code that
 * renders it — otherwise picking it silently does nothing. */

describe('visualizer options', () => {
  const registered = new Set(visualizerPresets.map((p) => p.id));

  it('every offered header/player preset has a scene and metadata', () => {
    for (const id of VISUAL_PRESETS.filter((p) => p !== 'MINIMAL')) {
      expect(registered.has(id), `${id} has no scene`).toBe(true);
      expect(visualizerMetadata(id), `${id} has no metadata`).toBeTruthy();
    }
  });

  it('every channel-background preset renders as a scene', () => {
    for (const id of BACKGROUND_VISUAL_PRESETS) {
      expect(registered.has(id), `${id} has no scene`).toBe(true);
    }
  });
});

describe('slideshow transitions', () => {
  it('every offered transition is handled by exactly one renderer', () => {
    for (const [id] of SLIDESHOW_PRESETS) {
      const css = (CSS_SLIDESHOW_PRESETS as readonly string[]).includes(id);
      const webgl = (WEBGL_SLIDESHOW_PRESETS as readonly string[]).includes(id);
      expect(css !== webgl, `${id}: css=${css} webgl=${webgl}`).toBe(true);
    }
  });

  it('every renderer preset is selectable', () => {
    const offered = SLIDESHOW_PRESETS.map(([id]) => id as string);
    for (const id of [...CSS_SLIDESHOW_PRESETS, ...WEBGL_SLIDESHOW_PRESETS]) {
      expect(offered).toContain(id);
    }
  });
});

describe('text overlay effects', () => {
  it('every mode has a label and renders its own effect class', () => {
    for (const mode of TEXT_OVERLAY_MODES) {
      expect(TEXT_OVERLAY_MODE_LABELS[mode]).toBeTruthy();
      const html = renderToStaticMarkup(
        <ChannelTextOverlayView mode={mode} text="Hello" align="LEFT" />,
      );
      if (mode === 'NONE') {
        expect(html).toBe('');
      } else {
        expect(html).toContain('channel-text-overlay--');
        expect(html).toContain('Hello');
      }
    }
  });

  it('every alignment renders its class', () => {
    const cls = { LEFT: '--left', CENTER: '--center', RIGHT: '--right' };
    for (const align of TEXT_OVERLAY_ALIGNMENTS) {
      expect(TEXT_OVERLAY_ALIGN_LABELS[align]).toBeTruthy();
      expect(
        renderToStaticMarkup(
          <ChannelTextOverlayView mode="COSMIC_NEON" text="x" align={align} />,
        ),
      ).toContain(`channel-text-overlay${cls[align]}`);
    }
  });

  it('renders nothing for blank text', () => {
    expect(
      renderToStaticMarkup(
        <ChannelTextOverlayView mode="GHOST_ECHO" text="  " align="LEFT" />,
      ),
    ).toBe('');
  });
});

describe('now-playing overlay styles', () => {
  it('each style renders title and artist with a distinct layout', () => {
    const layouts = new Set<string>();
    for (const preset of NOW_PLAYING_OVERLAY_PRESETS) {
      const html = renderToStaticMarkup(
        <NowPlayingOverlay
          presetId={preset.id}
          title="Song title"
          artist="The Artist"
          settings={DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS}
        />,
      );
      expect(html, preset.id).toContain('Song title');
      expect(html, preset.id).toContain('The Artist');
      layouts.add(html);
    }
    expect(layouts.size).toBe(NOW_PLAYING_OVERLAY_PRESETS.length);
  });

  it('applies scale, offset and opacity settings', () => {
    const html = renderToStaticMarkup(
      <NowPlayingOverlay
        presetId="classic"
        title="t"
        artist="a"
        settings={{ textScale: 1.5, offsetX: 10, offsetY: -4, opacity: 0.5 }}
      />,
    );
    expect(html).toContain('translate(10px, -4px) scale(1.5)');
    expect(html).toContain('opacity:0.5');
  });
});

describe('brand accents', () => {
  it('have unique ids and valid colours and gradients', () => {
    const ids = BRAND_ACCENTS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const brand of BRAND_ACCENTS) {
      expect(brand.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(brand.highlight).toMatch(/^#[0-9A-F]{6}$/i);
      expect(brand.gradient).toMatch(/^linear-gradient\(/);
    }
  });
});

describe('header styles', () => {
  it('every style resolves to itself; slideshow wins when a gallery is on', () => {
    for (const style of HEADER_STYLES) {
      expect(resolveHeaderDesignMode(style, false)).toBe(style);
      expect(resolveHeaderDesignMode(style, true)).toBe('SLIDESHOW');
    }
    expect(resolveHeaderDesignMode('nonsense', false)).toBe('GRADIENT');
  });
});

describe('what a save sends to the API', () => {
  const visual = {
    visualPreset: 'AURORA',
    headerStyle: 'SOLID',
    topBarText: '  New album out Friday  ',
    brandAccentPreset: 'ember',
    nowPlayingOverlayStyle: 'edge',
    usePlayerGradient: true,
    useBackgroundGradient: true,
    backgroundVisualPreset: 'FAT_LINES',
    channelLinks: [{ label: 'Site', url: 'https://example.com' }],
    textOverlayMode: 'COSMIC_NEON',
    textOverlayText: 'Hi',
    textOverlayAlign: 'LEFT',
    playerOverlayMode: 'GHOST_ECHO',
    playerOverlayText: 'Now',
    playerOverlayAlign: 'RIGHT',
  } as unknown as ChannelVisual;
  const scheme = { accent: '#111111', bg: '#222222' };
  const patch = buildVisualPatch(
    {
      visual,
      scheme,
      playerScheme: scheme,
      backgroundScheme: scheme,
      visualSettings: { AURORA: { speed: 2 } },
      slideshowPreset: 'CUBE_FLIP',
      slideshowInterval: 12,
      slideshowTransition: 900,
      slideshowAutoplay: false,
      overlaySettings: DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
    },
    'https://x/y.mp4',
  )!;
  const sent = toChannelVisualApiPatch(patch);

  it('sends every look setting the server persists', () => {
    expect(sent).toMatchObject({
      visualPreset: 'AURORA',
      headerStyle: 'SOLID',
      videoBackgroundUrl: 'https://x/y.mp4',
      brandAccentPreset: 'ember',
      topBarText: 'New album out Friday',
      slideshowPreset: 'CUBE_FLIP',
      slideshowIntervalSeconds: 12,
      slideshowTransitionMs: 900,
      slideshowAutoplay: false,
      nowPlayingOverlayStyle: 'edge',
      usePlayerGradient: true,
      useBackgroundGradient: true,
      backgroundVisualPreset: 'FAT_LINES',
      playerOverlayMode: 'GHOST_ECHO',
      playerOverlayText: 'Now',
      playerOverlayAlign: 'RIGHT',
    });
    expect(sent.colorScheme).toBeTruthy();
    expect(sent.visualSettings).toEqual({ AURORA: { speed: 2 } });
    expect(sent.channelLinks).toHaveLength(1);
    expect(JSON.parse(sent.playerColorSchemeJson!)).toMatchObject(scheme);
    expect(JSON.parse(sent.backgroundColorSchemeJson!)).toMatchObject(scheme);
  });

  it('every API key the designer writes is a real patch key', () => {
    for (const key of Object.keys(sent)) {
      expect(CHANNEL_VISUAL_API_PATCH_KEYS as readonly string[]).toContain(key);
    }
  });
});
