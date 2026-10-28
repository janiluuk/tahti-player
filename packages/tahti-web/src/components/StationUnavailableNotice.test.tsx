import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import { usePlayerStore } from '../stores/playerStore';
import { useStationHealthStore } from '../stores/stationHealthStore';
import { StationUnavailableNotice } from './StationUnavailableNotice';

const STATION: TahtiPlayable = {
  id: 'radio:tahti-radio',
  kind: 'radio',
  title: 'Tahti Radio',
  artist: 'Tahti',
  streamUrl: 'https://cdn.example/hls/master.m3u8',
  protocol: 'hls',
};

function mount(onPlay = vi.fn()) {
  render(
    <StationUnavailableNotice
      playableId={STATION.id}
      streamUrl={STATION.streamUrl}
      onPlay={onPlay}
    />,
  );
  return onPlay;
}

beforeEach(() => {
  useStationHealthStore.getState().reset();
  usePlayerStore.getState().clearQueue();
  usePlayerStore.setState({ status: 'idle', restoredPending: null });
});

afterEach(() => {
  cleanup();
});

describe('StationUnavailableNotice', () => {
  it('stays hidden while nothing is known to be wrong', () => {
    mount();
    expect(screen.queryByTestId('station-unavailable')).toBeNull();
  });

  it('shows a failed health check and starts the station on Try again', () => {
    act(() =>
      useStationHealthStore
        .getState()
        .markUnavailable(STATION.streamUrl, { reason: 'http', status: 404 }),
    );
    const onPlay = mount();

    expect(screen.getByTestId('station-unavailable')).toHaveTextContent(
      'Station unavailable · Server error (HTTP 404)',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('reloads the current station when its playback failed', () => {
    act(() => {
      usePlayerStore.getState().play(STATION);
      usePlayerStore
        .getState()
        .setStatus('error', 'Playback error', { reason: 'timeout' });
    });
    const onPlay = mount();
    const nonce = usePlayerStore.getState().reloadNonce;

    expect(screen.getByTestId('station-unavailable')).toHaveTextContent(
      'Timed out',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onPlay).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().reloadNonce).toBe(nonce + 1);
    expect(usePlayerStore.getState().status).toBe('loading');
  });
});
