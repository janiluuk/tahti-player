// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as gate from '../../api/studio-extras/sound-download-gate';
import { DownloadGateSection } from './DownloadGateSection';

const STATS = {
  repostToDownload: true,
  followToDownload: false,
  artistFollowerCount: 214,
  repostAckCount: 41,
  blockedDownloadAttempts: 17,
  countedDownloadCount: 63,
};

describe('DownloadGateSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the track's gate funnel when a gate is on", async () => {
    const spy = vi
      .spyOn(gate, 'fetchSoundDownloadGateStats')
      .mockResolvedValue({ data: STATS, meta: { source: 'api' } });
    await act(async () => {
      render(
        <DownloadGateSection
          soundId="s1"
          followToDownload={false}
          repostToDownload
          onChange={() => {}}
        />,
      );
    });
    expect(spy).toHaveBeenCalledWith('s1');
    const line = screen.getByTestId('download-gate-stats').textContent;
    expect(line).toContain('63 downloads');
    expect(line).toContain('17 stopped at the gate');
    expect(line).toContain('41 reposts');
  });

  it('hides the funnel with no gate and reports toggle changes', async () => {
    vi.spyOn(gate, 'fetchSoundDownloadGateStats').mockResolvedValue({
      data: STATS,
      meta: { source: 'api' },
    });
    const onChange = vi.fn();
    await act(async () => {
      render(
        <DownloadGateSection
          soundId="s1"
          followToDownload={false}
          repostToDownload={false}
          onChange={onChange}
        />,
      );
    });
    expect(screen.queryByTestId('download-gate-stats')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Require a follow' }));
    expect(onChange).toHaveBeenCalledWith({ followToDownload: true });
  });
});
