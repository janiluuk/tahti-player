import { requestJson } from './client-request';
import { isForceMock } from './mode';

export type SupportTicketCategory =
  'ENGAGEMENT_DISPUTE' | 'TECHNICAL' | 'FINANCIAL' | 'OTHER';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type SupportTicketInput = {
  subject: string;
  message: string;
  category: SupportTicketCategory;
  /** Required when not signed in. */
  contactEmail?: string;
};

export type MySupportTicketReply = {
  id: string;
  body: string;
  authorName: string;
  /** True for your own follow-up. Absent on API versions without replies. */
  fromRequester?: boolean;
  createdAt: string;
};

export type MySupportTicket = {
  id: string;
  subject: string;
  message: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: MySupportTicketReply[];
};

export async function submitSupportTicket(
  input: SupportTicketInput,
): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, ticketId: `mock-ticket-${Date.now()}` };
  }
  try {
    const { data } = await requestJson<{ ok: true; ticketId: string }>(
      '/api/support/contact',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send your message',
    };
  }
}

function mockMySupportTickets(): MySupportTicket[] {
  const day = 86_400_000;
  return [
    {
      id: 'mock-ticket-1',
      subject: 'Payout did not arrive',
      message: 'My March payout is still pending.',
      category: 'FINANCIAL',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - day * 3).toISOString(),
      updatedAt: new Date(Date.now() - day).toISOString(),
      replies: [
        {
          id: 'mock-reply-1',
          body: 'Thanks - we are checking this with the bank and will get back to you.',
          authorName: 'Tahti support',
          fromRequester: false,
          createdAt: new Date(Date.now() - day).toISOString(),
        },
        {
          id: 'mock-reply-2',
          body: 'Thank you. It is the payout for March.',
          authorName: 'You',
          fromRequester: true,
          createdAt: new Date(Date.now() - day / 2).toISOString(),
        },
      ],
    },
  ];
}

export async function fetchMySupportTickets(): Promise<
  { ok: true; tickets: MySupportTicket[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, tickets: mockMySupportTickets() };
  }
  try {
    const { data } = await requestJson<{ tickets: MySupportTicket[] }>(
      '/api/me/support/tickets',
    );
    return { ok: true, tickets: data.tickets };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not load your requests',
    };
  }
}

/** Answer the board on one of your own support requests. */
export async function replyToSupportTicket(
  ticketId: string,
  body: string,
): Promise<
  { ok: true; reply: MySupportTicketReply } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      reply: {
        id: `mock-reply-${Date.now()}`,
        body,
        authorName: 'You',
        fromRequester: true,
        createdAt: new Date().toISOString(),
      },
    };
  }
  try {
    const { data } = await requestJson<MySupportTicketReply>(
      `/api/me/support/tickets/${encodeURIComponent(ticketId)}/replies`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, reply: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send your reply',
    };
  }
}
