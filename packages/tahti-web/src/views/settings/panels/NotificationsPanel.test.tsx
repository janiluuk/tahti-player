import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  NotificationsPanel,
  NotificationsVisibilityPanel,
} from './NotificationsPanel';

vi.mock('../../../api/artist-settings', () => ({
  fetchNotificationPrefs: async () => ({
    data: {
      notifyMoneyMovesEmail: true,
      notifyMoneyMovesInApp: true,
      notifyListenerActivityEmail: true,
      notifyWeeklyRecapEmail: true,
    },
  }),
  patchNotificationPrefs: vi.fn(),
}));

vi.mock('../../../api/studio-extras', () => ({
  fetchMeProfile: async () => ({
    data: { id: 'u1', username: 'artist', socialLinks: {} },
    meta: { source: 'api' },
  }),
  patchMeProfile: vi.fn(),
}));

vi.mock('./TopListsToggle', () => ({ TopListsToggle: () => null }));
vi.mock('./CommentSettingsToggles', () => ({
  CommentSettingsToggles: () => null,
}));

describe('NotificationsPanel', () => {
  afterEach(() => cleanup());

  it('shows what each email looks like now that Tahti sends them', async () => {
    render(<NotificationsPanel />);
    expect(await screen.findByText('Money moves')).toBeTruthy();
    expect(screen.queryAllByRole('note')).toHaveLength(0);
    expect(screen.getByText(/3 new chat messages/)).toBeTruthy();
    expect(screen.getByText(/1,247 plays/)).toBeTruthy();
  });

  it('shows favourites and release announcements as coming soon', async () => {
    render(<NotificationsVisibilityPanel />);
    for (const name of ['Show favourites', 'Announce releases']) {
      const toggle = await screen.findByRole('switch', { name });
      expect(
        toggle.hasAttribute('disabled') ||
          toggle.getAttribute('aria-disabled') === 'true',
      ).toBe(true);
    }
    expect(
      screen.getByText(/doesn.t show favourites on profiles yet/),
    ).toBeTruthy();
    expect(
      screen.getByText(/doesn.t announce releases to followers yet/),
    ).toBeTruthy();
  });
});
