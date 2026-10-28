// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as gates from '../../../api/studio-extras/download-gates';
import { DownloadGatesPanel } from './DownloadGatesPanel';

describe('DownloadGatesPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows gate totals and each gated track', async () => {
    vi.spyOn(gates, 'fetchDownloadGateStats').mockResolvedValue({
      data: {
        artistFollowerCount: 214,
        items: [
          {
            soundId: 's1',
            title: 'Night Drive',
            repostToDownload: true,
            followToDownload: false,
            repostAckCount: 41,
            blockedDownloadAttempts: 17,
            countedDownloadCount: 63,
          },
        ],
        totals: { repostAcks: 41, blockedAttempts: 17, countedDownloads: 63 },
        daily: [],
      },
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<DownloadGatesPanel active />);
    });
    expect(screen.getByText('214')).toBeTruthy();
    expect(
      screen
        .getAllByText(/^(Downloads|Blocked|Reposts|Followers)$/)
        .map((label) => label.closest<HTMLElement>('[data-tone]'))
        .filter((tile) => tile !== null)
        .map((tile) => tile.dataset.tone),
    ).toEqual(['primary', 'yellow', 'green', 'purple']);
    const rows = within(screen.getByTestId('download-gates')).getAllByRole(
      'row',
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]!.textContent).toContain('Night Drive');
    expect(rows[1]!.textContent).toContain('Repost');
    expect(rows[1]!.textContent).not.toContain('Follow');
  });

  it('shows Retry when the stats fail to load', async () => {
    const fetch = vi.spyOn(gates, 'fetchDownloadGateStats').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await act(async () => {
      render(<DownloadGatesPanel active />);
    });
    expect(screen.getByText('Could not load download gates')).toBeTruthy();
    await act(async () => {
      screen.getByRole('button', { name: 'Retry' }).click();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('renders nothing on a failed load while the tab is hidden', async () => {
    vi.spyOn(gates, 'fetchDownloadGateStats').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    const { container } = await act(async () =>
      render(<DownloadGatesPanel active={false} />),
    );
    expect(container.textContent).toBe('');
  });
});
