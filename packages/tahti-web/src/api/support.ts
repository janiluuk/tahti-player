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
          createdAt: new Date(Date.now() - day).toISOString(),
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
