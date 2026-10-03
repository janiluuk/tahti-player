// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as broadcast from '../api/broadcast';
import { MulticastSection } from './MulticastSection';

describe('MulticastSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads the Tahti Radio destinations in the radio scope', async () => {
    const fetchTargets = vi
      .spyOn(broadcast, 'fetchRtmpTargets')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      render(
        <MulticastSection
          scope="radio"
          description="Destinations that receive the Tahti Radio stream."
        />,
      );
    });
    expect(fetchTargets).toHaveBeenCalledWith('radio');
    expect(
      screen.getByText('Destinations that receive the Tahti Radio stream.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /YouTube/ })).toBeTruthy();
  });

  it('loads the artist destinations by default', async () => {
    const fetchTargets = vi
      .spyOn(broadcast, 'fetchRtmpTargets')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      render(<MulticastSection />);
    });
    expect(fetchTargets).toHaveBeenCalledWith('me');
  });

  it('lets the radio scope switch rotation mirroring on and back off', async () => {
    vi.spyOn(broadcast, 'fetchRtmpTargets').mockResolvedValue({
      data: [
        {
          id: 'r1',
          provider: 'YOUTUBE',
          label: 'Radio YouTube',
          rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
          alwaysMirror: false,
          enabled: true,
          keyLast4: '9999',
        },
      ],
      meta: { source: 'api' },
    });
    const patch = vi
      .spyOn(broadcast, 'patchRtmpTarget')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      render(<MulticastSection scope="radio" />);
    });
    fireEvent.click(screen.getByRole('button', { name: /YouTube/ }));
    const toggle = () =>
      screen.getByRole('switch', {
        name: "Keep mirroring the 24/7 rotation when I'm offline",
      });
    const save = () => screen.getByRole('button', { name: /Save changes/ });
    fireEvent.click(toggle());
    await act(async () => {
      fireEvent.click(save());
    });
    fireEvent.click(toggle());
    await act(async () => {
      fireEvent.click(save());
    });
    expect(patch.mock.calls.map((call) => call[1].alwaysMirror)).toEqual([
      true,
      false,
    ]);
    expect(patch.mock.calls[0]?.[2]).toBe('radio');
  });
});
