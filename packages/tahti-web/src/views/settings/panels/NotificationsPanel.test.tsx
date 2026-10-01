import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotificationsPanel } from './NotificationsPanel';

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
  fetchDiscoveryPrefs: async () => ({ data: null }),
  patchDiscoveryPrefs: vi.fn(),
}));

vi.mock('../../../api/studio-extras', () => ({
  fetchMeProfile: async () => ({ data: null }),
  patchMeProfile: vi.fn(),
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
});
