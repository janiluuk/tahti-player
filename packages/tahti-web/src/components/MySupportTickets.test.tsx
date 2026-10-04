// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as support from '../api/support';
import { MySupportTickets } from './MySupportTickets';

describe('MySupportTickets', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists requests with their status and the support replies', async () => {
    vi.spyOn(support, 'fetchMySupportTickets').mockResolvedValue({
      ok: true,
      tickets: [
        {
          id: '2',
          subject: 'Payout missing',
          message: 'Where is my payout?',
          category: 'FINANCIAL',
          status: 'IN_PROGRESS',
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-02T10:00:00.000Z',
          replies: [
            {
              id: '7',
              body: 'Looking into it',
              authorName: 'Tahti support',
              createdAt: '2026-09-02T10:00:00.000Z',
            },
          ],
        },
        {
          id: '1',
          subject: 'Login trouble',
          message: 'Cannot sign in on mobile',
          category: 'TECHNICAL',
          status: 'OPEN',
          createdAt: '2026-08-01T10:00:00.000Z',
          updatedAt: '2026-08-01T10:00:00.000Z',
          replies: [],
        },
      ],
    });
    await act(async () => {
      render(<MySupportTickets />);
    });
    expect(screen.getByText('Payout missing')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
    const replies = screen.getByRole('list', {
      name: 'Replies to Payout missing',
    });
    expect(replies.textContent).toContain('Looking into it');
    expect(replies.textContent).toContain('Tahti support');
    expect(screen.getByText('No reply yet.')).toBeTruthy();
  });

  it('shows an empty state when there are no requests', async () => {
    vi.spyOn(support, 'fetchMySupportTickets').mockResolvedValue({
      ok: true,
      tickets: [],
    });
    await act(async () => {
      render(<MySupportTickets />);
    });
    expect(
      screen.getByText(/haven't contacted support while signed in yet/),
    ).toBeTruthy();
  });

  it('shows the error when loading fails', async () => {
    vi.spyOn(support, 'fetchMySupportTickets').mockResolvedValue({
      ok: false,
      error: 'HTTP 500',
    });
    await act(async () => {
      render(<MySupportTickets />);
    });
    expect(screen.getByRole('alert').textContent).toBe('HTTP 500');
  });

  it('sends a reply, shows it and reopens a resolved request', async () => {
    vi.spyOn(support, 'fetchMySupportTickets').mockResolvedValue({
      ok: true,
      tickets: [
        {
          id: '2',
          subject: 'Payout missing',
          message: 'Where is my payout?',
          category: 'FINANCIAL',
          status: 'RESOLVED',
          createdAt: '2026-09-01T10:00:00.000Z',
          updatedAt: '2026-09-02T10:00:00.000Z',
          replies: [],
        },
      ],
    });
    const send = vi.spyOn(support, 'replyToSupportTicket').mockResolvedValue({
      ok: true,
      reply: {
        id: '9',
        body: 'Still missing',
        authorName: 'You',
        fromRequester: true,
        createdAt: '2026-09-03T10:00:00.000Z',
      },
    });
    await act(async () => {
      render(<MySupportTickets />);
    });
    expect(screen.getByText('Resolved')).toBeTruthy();
    const box = screen.getByLabelText('Reply to Payout missing');
    const button = screen.getByRole('button', { name: 'Send reply' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(box, { target: { value: ' Still missing ' } });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(send).toHaveBeenCalledWith('2', 'Still missing');
    const replies = screen.getByRole('list', {
      name: 'Replies to Payout missing',
    });
    expect(replies.textContent).toContain('You');
    expect(replies.textContent).toContain('Still missing');
    expect(screen.getByText('Open')).toBeTruthy();
    expect((box as HTMLTextAreaElement).value).toBe('');
  });
});
