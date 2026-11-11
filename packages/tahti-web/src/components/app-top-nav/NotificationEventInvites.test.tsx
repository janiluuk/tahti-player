import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as calendar from '../../api/event-calendar';
import type { EventInvite } from '../../api/event-calendar';
import { NotificationEventInvites } from './NotificationEventInvites';

function invite(
  id: string,
  title: string,
  status: EventInvite['status'],
): EventInvite {
  return {
    event: {
      id,
      title,
      startAt: '2030-01-01T18:00:00.000Z',
    } as EventInvite['event'],
    host: {
      username: 'kaiku',
      displayName: 'Kaiku Collective',
      channelSlug: 'kaiku',
    },
    role: 'PERFORMER',
    status,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('NotificationEventInvites', () => {
  it('lists pending tags and answers one in place', async () => {
    vi.spyOn(calendar, 'fetchEventInvites').mockResolvedValue({
      data: [
        invite('e1', 'Club night', 'PENDING'),
        invite('e2', 'Old show', 'ACCEPTED'),
      ],
      meta: { source: 'api' },
    });
    const answer = vi
      .spyOn(calendar, 'answerEventInvite')
      .mockResolvedValue({ ok: true });

    render(<NotificationEventInvites />);

    const accept = await screen.findByRole('button', {
      name: 'Accept invite: Club night',
    });
    expect(screen.queryByText('Old show')).not.toBeInTheDocument();
    fireEvent.click(accept);

    expect(answer).toHaveBeenCalledWith('e1', 'accept');
    await waitFor(() =>
      expect(
        screen.queryByTestId('notification-event-invites'),
      ).not.toBeInTheDocument(),
    );
  });

  it('renders nothing when no tag waits for an answer', async () => {
    const fetch = vi.spyOn(calendar, 'fetchEventInvites').mockResolvedValue({
      data: [invite('e2', 'Old show', 'DECLINED')],
      meta: { source: 'api' },
    });

    const { container } = render(<NotificationEventInvites />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
