// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as announcements from '../api/announcements';
import { ChannelAnnouncementsPanel } from './ChannelAnnouncementsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ChannelAnnouncementsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the clips failed to load instead of "No announcement clips yet"', async () => {
    const fetch = vi
      .spyOn(announcements, 'fetchAnnouncementClips')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'HTTP 502' },
      } as never);
    render(<ChannelAnnouncementsPanel />);
    expect(
      await screen.findByText('Could not load your announcement clips'),
    ).toBeTruthy();
    expect(screen.queryByText('No announcement clips yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No announcement clips yet')).toBeTruthy();
  });
});
