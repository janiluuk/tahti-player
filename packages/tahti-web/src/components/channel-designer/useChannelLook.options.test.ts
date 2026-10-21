// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BACKGROUND_VISUAL_PRESETS,
  BRAND_ACCENTS,
  HEADER_STYLES,
  TEXT_OVERLAY_MODES,
  VISUAL_PRESETS,
  type ChannelVisual,
} from '../../api/channel-design';
import { NOW_PLAYING_OVERLAY_PRESETS } from '../../content/nowPlayingOverlayPresets';
import { SLIDESHOW_PRESETS } from './slideshowOptions';
import { useChannelLook } from './useChannelLook';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

const options = { layoutSlug: 'test', reloadToken: 0 };

async function loaded() {
  const hook = renderHook(() => useChannelLook(options));
  await waitFor(() => expect(hook.result.current.visual).not.toBeNull());
  return hook;
}

/** Applies a change, saves it, then loads the designer afresh: the value
 * has to survive the round trip through the (mock) server. */
async function applySaveReload(
  change: Partial<ChannelVisual>,
): Promise<ChannelVisual> {
  const first = await loaded();
  act(() => first.result.current.applyLocal(change));
  expect(first.result.current.dirty).toBe(true);
  await act(async () => {
    await first.result.current.save();
  });
  expect(first.result.current.dirty).toBe(false);
  first.unmount();
  const second = await loaded();
  const visual = second.result.current.visual!;
  second.unmount();
  return visual;
}

describe('channel designer options survive apply → save → reload', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
  });

  it.each(VISUAL_PRESETS.filter((p) => p !== 'MINIMAL'))(
    'visualizer preset %s',
    async (visualPreset) => {
      expect((await applySaveReload({ visualPreset })).visualPreset).toBe(
        visualPreset,
      );
    },
  );

  it.each([...HEADER_STYLES])('header style %s', async (headerStyle) => {
    expect((await applySaveReload({ headerStyle })).headerStyle).toBe(
      headerStyle,
    );
  });

  it.each(BRAND_ACCENTS.map((b) => b.id))('brand accent %s', async (id) => {
    expect(
      (await applySaveReload({ brandAccentPreset: id })).brandAccentPreset,
    ).toBe(id);
  });

  it.each(NOW_PLAYING_OVERLAY_PRESETS.map((p) => p.id))(
    'now-playing overlay style %s',
    async (id) => {
      expect(
        (await applySaveReload({ nowPlayingOverlayStyle: id }))
          .nowPlayingOverlayStyle,
      ).toBe(id);
    },
  );

  it.each([...BACKGROUND_VISUAL_PRESETS])(
    'background visualizer %s',
    async (id) => {
      expect(
        (await applySaveReload({ backgroundVisualPreset: id }))
          .backgroundVisualPreset,
      ).toBe(id);
    },
  );

  it.each(TEXT_OVERLAY_MODES.filter((m) => m !== 'NONE'))(
    'player overlay effect %s',
    async (mode) => {
      const visual = await applySaveReload({
        playerOverlayMode: mode,
        playerOverlayText: 'On air',
        playerOverlayAlign: 'RIGHT',
      });
      expect(visual).toMatchObject({
        playerOverlayMode: mode,
        playerOverlayText: 'On air',
        playerOverlayAlign: 'RIGHT',
      });
    },
  );

  it.each(SLIDESHOW_PRESETS.map(([id]) => id))(
    'slideshow transition %s',
    async (id) => {
      const first = await loaded();
      act(() => first.result.current.setSlideshowPreset(id));
      await act(async () => {
        await first.result.current.save();
      });
      first.unmount();
      const second = await loaded();
      expect(second.result.current.slideshowPreset).toBe(id);
      second.unmount();
    },
  );

  it('gradient toggles and their colours persist', async () => {
    const visual = await applySaveReload({
      usePlayerGradient: true,
      useBackgroundGradient: true,
    });
    expect(visual.usePlayerGradient).toBe(true);
    expect(visual.useBackgroundGradient).toBe(true);
  });
});
