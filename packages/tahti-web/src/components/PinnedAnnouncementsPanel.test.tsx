// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as announcements from '../api/announcements';
import { PinnedAnnouncementsPanel } from './PinnedAnnouncementsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('PinnedAnnouncementsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('removes a pinned announcement only after a red confirm', async () => {
    vi.spyOn(
      announcements,
      'fetchPinnedAnnouncementsWithMeta',
    ).mockResolvedValue({
      data: [{ id: 'a1', body: 'New EP Friday', createdAt: '2026-11-01' }],
      meta: { source: 'api' },
    });
    const remove = vi
      .spyOn(announcements, 'deletePinnedAnnouncement')
      .mockResolvedValue({ ok: true });
    render(<PinnedAnnouncementsPanel slug="artist" />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete New EP Friday' }),
    );
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(screen.queryByText('New EP Friday')).toBeNull());
  });
});
