// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/my-radio-stations';
import { usePlayerStore } from '../../stores/playerStore';
import { MyRadioStations } from './MyRadioStations';

const STATION: api.MyRadioStation = {
  id: 'r1',
  presetId: null,
  name: 'Radio Helsinki',
  genre: 'Eclectic',
  description: null,
  iconUrl: null,
  programmingUrl: null,
  streamUrl: 'https://stream.example.com/helsinki.mp3',
  position: 0,
  currentProgramTitle: null,
  currentProgramArtist: null,
  currentProgramFetchedAt: null,
};

describe('MyRadioStations', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('plays, adds and removes stations', async () => {
    vi.spyOn(api, 'fetchMyRadioStations').mockResolvedValue({
      data: [STATION],
      meta: { source: 'api' },
    });
    const addSpy = vi.spyOn(api, 'addMyRadioStation').mockResolvedValue({
      ok: true,
      data: { ...STATION, id: 'r2', name: 'Basso', position: 1 },
    });
    const removeSpy = vi
      .spyOn(api, 'removeMyRadioStation')
      .mockResolvedValue({ ok: true });
    const play = vi.fn();
    usePlayerStore.setState({ play });
    await act(async () => {
      render(<MyRadioStations />);
    });
    const list = screen.getByTestId('my-radio-stations');
    expect(list.textContent).toContain('Radio Helsinki');
    expect(list.textContent).toContain('Eclectic');

    fireEvent.click(
      screen.getByRole('button', { name: 'Play Radio Helsinki' }),
    );
    expect(play).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'radio',
        streamUrl: STATION.streamUrl,
        sourceProvider: 'internet-radio',
      }),
    );

    fireEvent.change(screen.getByLabelText('Station name'), {
      target: { value: 'Basso' },
    });
    fireEvent.change(screen.getByLabelText('Stream URL'), {
      target: { value: 'https://stream.example.com/basso.mp3' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add station' }));
    });
    expect(addSpy).toHaveBeenCalledWith({
      name: 'Basso',
      streamUrl: 'https://stream.example.com/basso.mp3',
    });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Remove Radio Helsinki' }),
      );
    });
    expect(removeSpy).toHaveBeenCalledWith('r1');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an error state when the list fails to load', async () => {
    vi.spyOn(api, 'fetchMyRadioStations').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<MyRadioStations />);
    });
    expect(screen.getByText("Couldn't load your stations")).toBeTruthy();
  });
});
