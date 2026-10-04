// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../../api/admin/admin-support';
import type {
  AdminSupportTicket,
  AdminSupportTicketDetail,
} from '../../../../api/admin/admin-support';
import { SupportTab } from './SupportTab';

function ticket(overrides: Partial<AdminSupportTicket>): AdminSupportTicket {
  return {
    id: 't1',
    subject: 'Payout missing',
    category: 'FINANCIAL',
    status: 'IN_PROGRESS',
    artistUsername: 'fan',
    artistDisplayName: 'Fan',
    contactEmail: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

async function renderTab(rows: AdminSupportTicket[]) {
  if (!vi.isMockFunction(api.fetchAdminSupportTicketDetail)) {
    vi.spyOn(api, 'fetchAdminSupportTicketDetail').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
  }
  vi.spyOn(api, 'fetchAdminSupportTickets').mockResolvedValue({
    data: rows,
    meta: { source: 'api' },
  });
  await act(async () => {
    render(<SupportTab />);
  });
  // The list loads after a short search debounce.
  await screen.findByRole('button', { name: new RegExp(rows[0]!.subject) });
}

describe('SupportTab', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('marks tickets that are waiting on the board', async () => {
    await renderTab([
      ticket({ id: 't1', subject: 'Payout missing', awaitingReply: true }),
      ticket({ id: 't2', subject: 'Login trouble', awaitingReply: false }),
      ticket({ id: 't3', subject: 'Old API', status: 'OPEN' }),
    ]);
    const waiting = screen.getByRole('button', { name: /Payout missing/ });
    expect(within(waiting).getByText('Needs reply')).toBeTruthy();
    expect(screen.getAllByText('Needs reply')).toHaveLength(1);
  });

  it('clears the mark once the board replies', async () => {
    const detail: AdminSupportTicketDetail = {
      ...ticket({ awaitingReply: true }),
      message: 'Where is my payout?',
      notes: [],
    };
    vi.spyOn(api, 'fetchAdminSupportTicketDetail').mockResolvedValue({
      data: detail,
      meta: { source: 'api' },
    });
    vi.spyOn(api, 'postAdminSupportTicketMessage').mockResolvedValue({
      ok: true,
      data: {
        ...detail,
        notes: [
          {
            id: 'n1',
            body: 'On it',
            kind: 'MESSAGE',
            authorId: 'board',
            authorDisplayName: 'Board',
            createdAt: '2026-10-02T10:00:00.000Z',
          },
        ],
      },
    });
    await renderTab([ticket({ awaitingReply: true })]);
    expect(screen.getByText('Needs reply')).toBeTruthy();
    const box = screen.getByRole('textbox', { name: /reply/i });
    fireEvent.change(box, { target: { value: 'On it' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^(Send|Reply)/ }));
    });
    expect(screen.queryByText('Needs reply')).toBeNull();
  });
});
