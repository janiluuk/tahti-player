import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { patchMeProfile, type ProfileFields } from '../../../api/studio-extras';
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

  it('saves whether liked tracks show on the profile', async () => {
    vi.mocked(patchMeProfile).mockResolvedValue({
      ok: true,
      data: { showLikes: false } as ProfileFields,
    });
    render(<NotificationsVisibilityPanel />);
    const toggle = await screen.findByRole('switch', {
      name: 'Show tracks I like on my profile',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    expect(patchMeProfile).toHaveBeenCalledWith({ showLikes: false });
  });

  it('offers no switch that cannot be changed', async () => {
    render(<NotificationsVisibilityPanel />);
    await screen.findByRole('switch', {
      name: 'Show tracks I like on my profile',
    });
    expect(
      screen.queryByRole('switch', { name: 'Show favourites' }),
    ).toBeNull();
    expect(
      screen.queryByRole('switch', { name: 'Announce releases' }),
    ).toBeNull();
    expect(screen.queryByText(/Coming soon/i)).toBeNull();
  });
});
