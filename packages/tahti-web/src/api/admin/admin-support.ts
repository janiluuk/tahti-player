import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Support ─────────────────────────────────────────────────────────────────

export type AdminSupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type AdminSupportNoteKind = 'MESSAGE' | 'STATUS_CHANGE';

export type AdminSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: AdminSupportStatus;
  artistUsername: string | null;
  artistDisplayName: string | null;
  contactEmail: string | null;
  createdAt: string;
};

/** One row of a ticket's activity trail — a board reply, or an automatic
 * record of a status transition. Rendered together, oldest first. */
export type AdminSupportNote = {
  id: string;
  body: string;
  kind: AdminSupportNoteKind;
  authorId: string | null;
  authorDisplayName: string | null;
  createdAt: string;
};

export type AdminSupportTicketDetail = AdminSupportTicket & {
  message: string;
  notes: AdminSupportNote[];
};

function mockSupportTickets(): AdminSupportTicketDetail[] {
  return [
    {
      id: 'tkt-1',
      subject: 'Cannot connect OBS to multistream target',
      category: 'broadcast',
      status: 'OPEN',
      artistUsername: 'dj-moonlight',
      artistDisplayName: 'DJ Moonlight',
      contactEmail: null,
      createdAt: '2026-08-16T10:00:00.000Z',
      message:
        'OBS keeps disconnecting from the Twitch multistream target after ~2 minutes. Stream key looks right.',
      notes: [],
    },
    {
      id: 'tkt-2',
      subject: 'Payout never arrived',
      category: 'billing',
      status: 'IN_PROGRESS',
      artistUsername: 'midnight-cartography',
      artistDisplayName: 'Midnight Cartography',
      contactEmail: null,
      createdAt: '2026-08-15T09:00:00.000Z',
      message: "My August fan-sub payout hasn't shown up in Stripe Connect.",
      notes: [
        {
          id: 'note-1',
          body: 'Status changed from OPEN to IN_PROGRESS',
          kind: 'STATUS_CHANGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-15T12:00:00.000Z',
        },
        {
          id: 'note-2',
          body: 'Checking with Stripe on the transfer — will update within a day.',
          kind: 'MESSAGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-15T12:05:00.000Z',
        },
      ],
    },
    {
      id: 'tkt-3',
      subject: 'How do I change my channel URL?',
      category: 'general',
      status: 'RESOLVED',
      artistUsername: null,
      artistDisplayName: null,
      contactEmail: 'listener@example.com',
      createdAt: '2026-08-10T09:00:00.000Z',
      message: 'Is there a way to rename my channel slug from settings?',
      notes: [
        {
          id: 'note-3',
          body: 'Settings → Channel & design → Username & domain.',
          kind: 'MESSAGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-10T10:00:00.000Z',
        },
        {
          id: 'note-4',
          body: 'Status changed from OPEN to RESOLVED',
          kind: 'STATUS_CHANGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-10T10:01:00.000Z',
        },
      ],
    },
  ];
}

let mockSupportTicketsState: AdminSupportTicketDetail[] | null = null;

function getMockSupportTickets(): AdminSupportTicketDetail[] {
  if (!mockSupportTicketsState) {
    mockSupportTicketsState = mockSupportTickets();
  }
  return mockSupportTicketsState;
}

function toSupportTicketRow(t: AdminSupportTicketDetail): AdminSupportTicket {
  return {
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    artistUsername: t.artistUsername,
    artistDisplayName: t.artistDisplayName,
    contactEmail: t.contactEmail,
    createdAt: t.createdAt,
  };
}

export async function fetchAdminSupportTickets(params?: {
  status?: AdminSupportStatus;
  q?: string;
}): Promise<{ data: AdminSupportTicket[]; meta: FetchMeta }> {
  const status = params?.status;
  const q = params?.q?.trim();
  if (isForceMock()) {
    let data = getMockSupportTickets();
    if (status) {
      data = data.filter((t) => t.status === status);
    }
    if (q) {
      const needle = q.toLowerCase();
      data = data.filter(
        (t) =>
          t.subject.toLowerCase().includes(needle) ||
          t.message.toLowerCase().includes(needle) ||
          (t.artistUsername ?? '').toLowerCase().includes(needle) ||
          (t.artistDisplayName ?? '').toLowerCase().includes(needle) ||
          (t.contactEmail ?? '').toLowerCase().includes(needle),
      );
    }
    return {
      data: data.map(toSupportTicketRow),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (status) {
      qs.set('status', status);
    }
    if (q) {
      qs.set('q', q);
    }
    const data = await getJson<{ tickets: AdminSupportTicket[] }>(
      `/api/admin/support/tickets?${qs.toString()}`,
    );
    return { data: data.tickets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminSupportTicketDetail(
  id: string,
): Promise<{ data: AdminSupportTicketDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id) ?? null;
    return {
      data: ticket,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function updateAdminSupportTicketStatus(
  id: string,
  status: AdminSupportStatus,
): Promise<
  { ok: true; data: AdminSupportTicketDetail } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id);
    if (!ticket) {
      return { ok: false, error: 'Ticket not found' };
    }
    if (ticket.status !== status) {
      ticket.notes.push({
        id: `note-${Date.now()}`,
        body: `Status changed from ${ticket.status} to ${status}`,
        kind: 'STATUS_CHANGE',
        authorId: 'mock-board',
        authorDisplayName: 'You',
        createdAt: new Date().toISOString(),
      });
      ticket.status = status;
    }
    return { ok: true, data: ticket };
  }
  try {
    const data = await sendJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}`,
      'PATCH',
      { status },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function postAdminSupportTicketMessage(
  id: string,
  body: string,
): Promise<
  { ok: true; data: AdminSupportTicketDetail } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id);
    if (!ticket) {
      return { ok: false, error: 'Ticket not found' };
    }
    ticket.notes.push({
      id: `note-${Date.now()}`,
      body,
      kind: 'MESSAGE',
      authorId: 'mock-board',
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    });
    return { ok: true, data: ticket };
  }
  try {
    const data = await sendJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/notes`,
      'POST',
      { body },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

// ── Missed live shows ──────────────────────────────────────────────────────

export type AdminMissedShowStatus =
  | 'OPEN'
  | 'REVIEWING'
  | 'ACTIONED'
  | 'DISMISSED';

export type AdminMissedShow = {
  id: string;
  status: AdminMissedShowStatus;
  detectedAt: string;
  scheduledLiveShow: {
    id: string;
    title: string;
    startAt: string;
  };
  channel: {
    slug: string;
    userId: string;
    username: string;
    displayName: string;
  };
};

export async function fetchAdminMissedShows(
  status?: AdminMissedShowStatus,
): Promise<{ data: AdminMissedShow[]; meta: FetchMeta }> {
  try {
    const query = new URLSearchParams({ limit: '100' });
    if (status) {
      query.set('status', status);
    }
    const data = await getJson<{ flags: AdminMissedShow[] }>(
      `/api/admin/missed-live-shows?${query.toString()}`,
    );
    return { data: data.flags, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function updateAdminMissedShow(
  id: string,
  status: AdminMissedShowStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(
    `/api/admin/missed-live-shows/${encodeURIComponent(id)}`,
    'PATCH',
    { status },
  );
}
