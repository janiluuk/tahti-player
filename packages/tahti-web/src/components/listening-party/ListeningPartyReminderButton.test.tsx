import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchPartyReminder,
  setPartyReminder,
} from '../../api/listening-party-reminders';
import { useAuthStore } from '../../stores/authStore';
import { ListeningPartyReminderButton } from './ListeningPartyReminderButton';

vi.mock('../../api/listening-party-reminders', () => ({
  fetchPartyReminder: vi.fn(),
  setPartyReminder: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ListeningPartyReminderButton', () => {
  beforeEach(() => {
    vi.mocked(fetchPartyReminder).mockResolvedValue({
      data: { reminded: false, count: 4 },
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lets a signed-in listener ask for a reminder and take it back', async () => {
    useAuthStore.setState({ user: { username: 'fan' } as never });
    vi.mocked(setPartyReminder)
      .mockResolvedValueOnce({ ok: true, data: { reminded: true, count: 5 } })
      .mockResolvedValueOnce({ ok: true, data: { reminded: false, count: 4 } });
    render(<ListeningPartyReminderButton partyId="p1" state="SCHEDULED" />);

    const button = await screen.findByRole('button', { name: 'Remind me' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText('4 people want a reminder')).toBeTruthy();

    await act(async () => {
      fireEvent.click(button);
    });
    expect(setPartyReminder).toHaveBeenCalledWith('p1', true);
    const on = screen.getByRole('button', { name: 'Reminder set' });
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('5 people want a reminder')).toBeTruthy();

    await act(async () => {
      fireEvent.click(on);
    });
    expect(setPartyReminder).toHaveBeenLastCalledWith('p1', false);
  });

  it('shows signed-out visitors only the count', async () => {
    render(<ListeningPartyReminderButton partyId="p1" state="SCHEDULED" />);
    expect(await screen.findByText('4 people want a reminder')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows nothing once the party has started', () => {
    render(<ListeningPartyReminderButton partyId="p1" state="LIVE" />);
    expect(fetchPartyReminder).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
