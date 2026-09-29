// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/release-analytics';
import { ReleaseSmartLinkStats } from './ReleaseSmartLinkStats';

describe('ReleaseSmartLinkStats', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows views, clicks and clicks per service, busiest first', async () => {
    const spy = vi
      .spyOn(api, 'fetchReleaseSmartLinkAnalytics')
      .mockResolvedValue({
        data: {
          releaseId: 'r1',
          smartLinkSlug: 'night-drive',
          smartLinkViewCount: 200,
          totalClicks: 50,
          clicksByPlatform: { bandcamp: 10, spotify: 40 },
        },
        meta: { source: 'api' },
      });
    await act(async () => {
      render(<ReleaseSmartLinkStats releaseId="r1" />);
    });
    expect(spy).toHaveBeenCalledWith('r1');
    expect(screen.getByText('200')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    const rows = within(screen.getByTestId('smart-link-clicks')).getAllByRole(
      'listitem',
    );
    expect(rows[0]!.textContent).toBe('Spotify40');
    expect(rows[1]!.textContent).toBe('Bandcamp10');
  });

  it('renders nothing when the stats fail to load', async () => {
    vi.spyOn(api, 'fetchReleaseSmartLinkAnalytics').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    const { container } = await act(async () =>
      render(<ReleaseSmartLinkStats releaseId="r1" />),
    );
    expect(container.textContent).toBe('');
  });
});
