import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchBroadcastPreflight,
  fetchStreamOverlay,
  patchStreamOverlay,
  type StreamOverlay,
} from '../api/broadcast';
import { fetchMeProfile } from '../api/studio-extras';
import { StreamOverlayEditor } from './StreamOverlayEditor';

vi.mock('../api/broadcast', () => ({
  fetchBroadcastPreflight: vi.fn(),
  fetchStreamOverlay: vi.fn(),
  patchStreamOverlay: vi.fn(),
}));
vi.mock('../api/client', () => ({ fetchChannel: vi.fn() }));
vi.mock('../api/studio-extras', () => ({ fetchMeProfile: vi.fn() }));
vi.mock('../api/user-media', () => ({ uploadUserMediaFile: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const saved: StreamOverlay = {
  streamOverlayTitle: 'Friday set',
  streamOverlaySubtitle: null,
  streamOverlayShowTitle: false,
  streamOverlayTextColor: null,
  streamOverlayScrimEnabled: false,
  streamOverlayCoverUrl: null,
  streamOverlayBackdropUrl: 'https://cdn.example/backdrop.jpg',
  streamOverlayVisualPreset: 'AURORA',
};

async function renderEditor() {
  vi.mocked(fetchStreamOverlay).mockResolvedValue({
    data: saved,
    meta: { source: 'api' },
  });
  vi.mocked(fetchBroadcastPreflight).mockResolvedValue({
    data: null,
  } as unknown as Awaited<ReturnType<typeof fetchBroadcastPreflight>>);
  vi.mocked(fetchMeProfile).mockResolvedValue({
    data: { avatarUrl: null },
  } as unknown as Awaited<ReturnType<typeof fetchMeProfile>>);
  vi.mocked(patchStreamOverlay).mockImplementation(async (patch) => ({
    ok: true,
    data: patch,
  }));
  await act(async () => {
    render(<StreamOverlayEditor />);
  });
}

describe('StreamOverlayEditor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads and saves the backdrop and visualizer preset', async () => {
    await renderEditor();
    expect(
      screen.getByRole('button', { name: 'Preview overlay backdrop' }),
    ).toBeTruthy();
    expect(screen.getByText('Aurora')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save overlay/ }));
    });
    expect(patchStreamOverlay).toHaveBeenCalledWith(
      expect.objectContaining({
        streamOverlayBackdropUrl: 'https://cdn.example/backdrop.jpg',
        streamOverlayVisualPreset: 'AURORA',
      }),
    );
  });

  it('sends a newly picked visualizer preset', async () => {
    await renderEditor();
    await act(async () => {
      fireEvent.click(screen.getByText('Aurora'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: 'Cloudscape' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save overlay/ }));
    });
    expect(patchStreamOverlay).toHaveBeenCalledWith(
      expect.objectContaining({ streamOverlayVisualPreset: 'CLOUDSCAPE' }),
    );
  });
});
