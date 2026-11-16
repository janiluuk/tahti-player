// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as studio from '../api/studio';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { TrackDetailView } from './TrackDetailView';

vi.mock('../components/ChannelVisualizer', () => ({
  ChannelVisualizer: () => null,
}));

const TRACK_ID = 'northern-lights-archive-2';

async function settle() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

describe('TrackDetailView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('shows the last loaded track at once on a revisit', async () => {
    const first = await renderWithRouter(<TrackDetailView id={TRACK_ID} />);
    await settle();
    expect(screen.getByTestId('track-listen-page')).toBeTruthy();
    first.unmount();

    vi.spyOn(client, 'fetchTrackDetail').mockReturnValue(new Promise(() => {}));
    await renderWithRouter(<TrackDetailView id={TRACK_ID} />);
    expect(screen.getByTestId('track-listen-page')).toBeTruthy();
    expect(screen.queryByText('Loading track…')).toBeNull();
  });

  it('keeps the saved track and flags a failed refresh', async () => {
    const first = await renderWithRouter(<TrackDetailView id={TRACK_ID} />);
    await settle();
    first.unmount();

    vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<TrackDetailView id={TRACK_ID} />);
    await settle();
    expect(screen.getByTestId('track-listen-page')).toBeTruthy();
    expect(
      screen.getByText('Could not refresh; showing the last loaded version.'),
    ).toBeTruthy();
  });

  it('says the track failed to load when nothing was saved', async () => {
    vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    await renderWithRouter(<TrackDetailView id={TRACK_ID} />);
    await settle();
    expect(screen.getByText('HTTP 503')).toBeTruthy();
    expect(screen.queryByTestId('track-listen-page')).toBeNull();
  });

  describe('an upload that is still processing', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: { id: 'u-artist', username: 'artist', displayName: 'Artist' },
      } as never);
      vi.spyOn(client, 'fetchTrackDetail').mockResolvedValue({
        data: null,
        meta: { source: 'api' },
      });
    });
    afterEach(() => {
      useAuthStore.setState({ user: null });
    });

    it('opens the track page with the processing state for the owner', async () => {
      vi.spyOn(studio, 'fetchStudioSound').mockResolvedValue({
        data: { id: 'up1', title: 'Fresh upload', status: 'PROCESSING' },
        meta: { source: 'api' },
      });
      await renderWithRouter(<TrackDetailView id="up1" />);
      await settle();
      expect(screen.getByTestId('track-listen-page')).toBeTruthy();
      expect(
        screen.getByRole('heading', { name: 'Fresh upload' }),
      ).toBeTruthy();
      expect(screen.getByTestId('track-processing').textContent).toContain(
        'The player appears here when the track is ready.',
      );
      expect(screen.queryByText('Track unavailable')).toBeNull();
    });

    it('treats the API 404 for a processing upload as not found, not a failed load', async () => {
      vi.stubEnv('VITE_FORCE_MOCK', '');
      vi.mocked(client.fetchTrackDetail).mockRestore();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('{"error":"Track not found"}', { status: 404 }),
      );
      vi.spyOn(studio, 'fetchStudioSound').mockResolvedValue({
        data: { id: 'up2', title: 'Fresh upload', status: 'PENDING' },
        meta: { source: 'api' },
      });
      await renderWithRouter(<TrackDetailView id="up2" />);
      await settle();
      expect(screen.getByTestId('track-processing')).toBeTruthy();
      expect(
        screen.queryByText(
          'Could not refresh; showing the last loaded version.',
        ),
      ).toBeNull();
    });

    it('still says unavailable when the sound is ready but not public', async () => {
      vi.spyOn(studio, 'fetchStudioSound').mockResolvedValue({
        data: { id: 'up1', title: 'Fresh upload', status: 'READY' },
        meta: { source: 'api' },
      });
      await renderWithRouter(<TrackDetailView id="up1" />);
      await settle();
      expect(screen.getByText('Track unavailable')).toBeTruthy();
    });
  });
});
