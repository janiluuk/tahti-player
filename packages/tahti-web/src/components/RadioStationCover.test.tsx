// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  listMockInternetRadioPresets,
  resetMockInternetRadioPresets,
} from '../api/internetRadioPresetsMockStore';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { RadioStationCover } from './RadioStationCover';

const BOARD_USER: AuthUser = {
  id: 'board-1',
  email: 'board@tahti.live',
  username: 'board',
  displayName: 'Board',
  role: 'BOARD',
  isBoard: true,
};

const ARTIST_USER: AuthUser = {
  id: 'artist-1',
  email: 'artist@tahti.live',
  username: 'artist',
  displayName: 'Artist',
  role: 'ARTIST',
};

function renderCover(user: AuthUser | null): {
  container: HTMLDivElement;
  root: Root;
} {
  useAuthStore.setState({ user, hydrated: true, loading: false });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <RadioStationCover
        src="/radio-logos/radio-helsinki.png"
        label="Radio Helsinki"
        stationName="Radio Helsinki"
        catalogStationId="radio-helsinki"
      />,
    );
  });
  return { container, root };
}

describe('RadioStationCover', () => {
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
    document.body.replaceChildren();
    vi.unstubAllEnvs();
  });

  it('hides the edit control for non-admins', () => {
    const { container } = renderCover(ARTIST_USER);
    expect(
      container.querySelector('[data-testid="radio-station-cover-edit"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-testid="radio-station-cover-image"]'),
    ).not.toBeNull();
  });

  it('shows a hover edit control for admins and persists a replacement', async () => {
    const { container } = renderCover(BOARD_USER);
    const edit = container.querySelector(
      '[data-testid="radio-station-cover-edit"]',
    );
    expect(edit).not.toBeNull();
    expect(edit?.getAttribute('aria-label')).toBe('Edit Radio Helsinki cover');

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([Uint8Array.from([137, 80, 78, 71])], 'cover.png', {
      type: 'image/png',
    });
    await act(async () => {
      Object.defineProperty(input, 'files', {
        configurable: true,
        value: [file],
      });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await vi.waitFor(() => {
      expect(
        useListenerWidgetsStore.getState().stationOverrides['radio-helsinki']
          ?.logoUrl,
      ).toMatch(/^data:image\/png/);
    });
    expect(
      listMockInternetRadioPresets().find((p) => p.name === 'Radio Helsinki')
        ?.iconUrl,
    ).toMatch(/^data:image\/png/);
  });
});
