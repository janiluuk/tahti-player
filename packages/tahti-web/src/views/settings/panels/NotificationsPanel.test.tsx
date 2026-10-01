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

  it('says plainly which emails Tahti does not send yet', async () => {
    render(<NotificationsPanel />);
    expect(await screen.findByText('Money moves')).toBeTruthy();
    const notes = screen.getAllByRole('note');
    expect(notes).toHaveLength(1);
    for (const note of notes) {
      expect(note.textContent).toContain('Coming soon');
      expect(note.textContent).toContain("Tahti doesn't send this email yet");
    }
    expect(screen.getByText(/1,247 plays/)).toBeTruthy();
  });
});
