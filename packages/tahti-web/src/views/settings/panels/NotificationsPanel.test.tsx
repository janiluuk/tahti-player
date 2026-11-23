import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  NotificationsPanel,
  NotificationsVisibilityPanel,
} from './NotificationsPanel';

const PREFS = {
  notifyMoneyMovesEmail: true,
  notifyMoneyMovesInApp: true,
  notifyListenerActivityEmail: true,
  notifyWeeklyRecapEmail: true,
  notifyStudioJobsInApp: true,
};

let prefsFailure: string | null = null;

vi.mock('../../../api/artist-settings', () => ({
  fetchNotificationPrefs: async () =>
    prefsFailure
      ? {
          data: { ...PREFS, notifyMoneyMovesEmail: false },
          meta: { source: 'api', reason: prefsFailure },
        }
      : { data: PREFS, meta: { source: 'api' } },
  patchNotificationPrefs: vi.fn(),
}));

vi.mock('@tahti-player/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tahti-player/ui')>()),
  ButtonLink: ({ children }: { children: React.ReactNode }) => (
    <a href="/studio/profile/visibility">{children}</a>
  ),
}));

describe('NotificationsPanel', () => {
  afterEach(() => cleanup());

  it('shows what each email looks like now that Tahti sends them', async () => {
    render(<NotificationsPanel />);
    expect(await screen.findByText('Revenue moves')).toBeTruthy();
    expect(screen.getByText(/you are awarded a grant/)).toBeTruthy();
    expect(screen.getByText('Studio work')).toBeTruthy();
    expect(screen.queryAllByRole('note')).toHaveLength(0);
    expect(screen.getByText(/3 new chat messages/)).toBeTruthy();
    expect(screen.getByText(/1,247 plays/)).toBeTruthy();
  });

  it('says the settings failed to load instead of showing them all off', async () => {
    prefsFailure = 'HTTP 502';
    render(<NotificationsPanel />);
    expect(
      await screen.findByText('Could not load your notification settings'),
    ).toBeTruthy();
    expect(screen.queryByText('Revenue moves')).toBeNull();

    prefsFailure = null;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Revenue moves')).toBeTruthy();
  });

  it('points to Studio for profile visibility instead of showing it here', async () => {
    render(<NotificationsVisibilityPanel />);
    expect(
      await screen.findByText(/now in Studio → Profile → Visibility/),
    ).toBeTruthy();
    expect(
      screen.queryByRole('switch', {
        name: 'Show tracks I like on my profile',
      }),
    ).toBeNull();
  });
});
