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
    const rows = within(screen.getByTestId('download-gates')).getAllByRole(
      'row',
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]!.textContent).toContain('Night Drive');
    expect(rows[1]!.textContent).toContain('Repost');
    expect(rows[1]!.textContent).not.toContain('Follow');
  });

  it('renders nothing when the stats fail to load', async () => {
    vi.spyOn(gates, 'fetchDownloadGateStats').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    const { container } = await act(async () =>
      render(<DownloadGatesPanel active />),
    );
    expect(container.textContent).toBe('');
  });
});
