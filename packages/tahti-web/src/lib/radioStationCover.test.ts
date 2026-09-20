// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  listMockInternetRadioPresets,
  resetMockInternetRadioPresets,
} from '../api/internetRadioPresetsMockStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import {
  canEditRadioStationCover,
  persistRadioStationCover,
  uploadRadioCoverFile,
} from './radioStationCover';

describe('radio station cover', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
    resetMockInternetRadioPresets();
    useListenerWidgetsStore.setState({
      installedTypeIds: [],
      instances: [],
      enabledStationIds: [],
      stationOverrides: {},
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows only board admins to edit covers', () => {
    expect(canEditRadioStationCover(null)).toBe(false);
    expect(
      canEditRadioStationCover({
        id: 'artist-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'Artist',
        role: 'ARTIST',
      }),
    ).toBe(false);
    expect(
      canEditRadioStationCover({
        id: 'board-1',
        email: 'board@tahti.live',
        username: 'board',
        displayName: 'Board',
        role: 'BOARD',
        isBoard: true,
      }),
    ).toBe(true);
  });

  it('writes the new cover to the catalog override and matching admin preset', async () => {
    const logoUrl = 'https://cdn.example/cover.png';

    const result = await persistRadioStationCover({
      catalogStationId: 'radio-helsinki',
      stationName: 'Radio Helsinki',
      logoUrl,
    });

    expect(result).toEqual({ ok: true });
    expect(
      useListenerWidgetsStore.getState().stationOverrides['radio-helsinki']
        ?.logoUrl,
    ).toBe(logoUrl);
    expect(
      listMockInternetRadioPresets().find((p) => p.name === 'Radio Helsinki')
        ?.iconUrl,
    ).toBe(logoUrl);
  });

  it('updates a matching catalog station when only the preset is named', async () => {
    const logoUrl = 'https://cdn.example/cover.webp';

    const result = await persistRadioStationCover({
      presetId: 'preset-radio-helsinki',
      stationName: 'Radio Helsinki',
      logoUrl,
    });

    expect(result).toEqual({ ok: true });
    expect(
      useListenerWidgetsStore.getState().stationOverrides['radio-helsinki']
        ?.logoUrl,
    ).toBe(logoUrl);
    expect(
      listMockInternetRadioPresets().find((p) => p.name === 'Radio Helsinki')
        ?.iconUrl,
    ).toBe(logoUrl);
  });

  it('absolutizes same-origin catalog logo paths before patching the preset', async () => {
    const result = await persistRadioStationCover({
      catalogStationId: 'radio-helsinki',
      stationName: 'Radio Helsinki',
      logoUrl: '/radio-logos/radio-helsinki.png',
    });

    expect(result).toEqual({ ok: true });
    expect(
      listMockInternetRadioPresets().find((p) => p.name === 'Radio Helsinki')
        ?.iconUrl,
    ).toMatch(/^https?:\/\/.+\/radio-logos\/radio-helsinki\.png$/);
  });

  it('reads an uploaded file as a persistable data URL in mock mode', async () => {
    const file = new File([Uint8Array.from([137, 80, 78, 71])], 'cover.png', {
      type: 'image/png',
    });

    const result = await uploadRadioCoverFile(file);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.url.startsWith('data:image/png')).toBe(true);
    }
  });
});
