import type { FetchMeta } from './client';
import {
  mockEvents,
  normalizeEvent,
  type ArtistEvent,
  type ArtistEventParticipantStatus,
  type ArtistEventRole,
} from './events';
import { apiBase } from './http';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type CalendarEvent = ArtistEvent & {
  artistDisplayName: string;
  artistUsername: string;
  channelSlug: string | null;
  avatarUrl: string | null;
};

export type EventInvite = {
  event: ArtistEvent;
  host: { username: string; displayName: string; channelSlug: string | null };
  role: ArtistEventRole;
  status: ArtistEventParticipantStatus;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const MOCK_HOST = {
  artistDisplayName: 'Demo Artist',
  artistUsername: 'demo',
  channelSlug: 'demo',
  avatarUrl: null,
};

const DAY = 86_400_000;

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function mockCalendarRows(): CalendarEvent[] {
  const base = Date.now();
  const shifted = mockEvents.map((event, index) => {
    const startAt = new Date(base + (index * 4 - 6) * DAY).toISOString();
    return { ...event, ...MOCK_HOST, startAt, endAt: null };
  });
  return [
    ...shifted,
    {
      ...normalizeEvent({
        id: 'evt-mock-guest',
        title: 'Aurora Drift b2b Northern Lights',
        description: 'Back-to-back closing set on the roof terrace.',
        place: 'Kaiku',
        location: 'Helsinki, Finland',
        startAt: new Date(base + 2 * DAY).toISOString(),
        status: 'PUBLISHED',
      }),
      artistDisplayName: 'Northern Lights',
      artistUsername: 'northern-lights',
      channelSlug: 'northern-lights',
      avatarUrl: null,
    },
  ];
}

/** Public events between `from` and `to` (at most 92 days), optionally for
 * one artist including events they accepted a tag on. */
export async function fetchEventCalendar(params: {
  from: Date;
  to: Date;
  artist?: string;
}): Promise<{ data: CalendarEvent[]; meta: FetchMeta }> {
  const from = params.from.toISOString();
  const to = params.to.toISOString();
  if (isForceMock()) {
    const rows = mockCalendarRows().filter(
      (event) =>
        event.status !== 'DRAFT' &&
        event.startAt >= from &&
        event.startAt < to &&
        (!params.artist ||
          event.artistUsername === params.artist ||
          event.participants.some(
            (p) => p.username === params.artist && p.status === 'ACCEPTED',
          )),
    );
    return {
      data: rows.sort((a, b) => a.startAt.localeCompare(b.startAt)),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  const query = new URLSearchParams({ from, to });
  if (params.artist) {
    query.set('artist', params.artist);
  }
  try {
    const { data } = await requestJson<CalendarEvent[]>(
      `/api/v1/events?${query.toString()}`,
    );
    return {
      data: Array.isArray(data)
        ? data.map((row) => ({ ...row, ...normalizeEvent(row) }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** One public event (`GET /api/v1/events/:id`). */
export async function fetchPublicEvent(id: string): Promise<{
  data: CalendarEvent | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const row = mockCalendarRows().find(
      (event) => event.id === id && event.status !== 'DRAFT',
    );
    return {
      data: row ?? null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<CalendarEvent>(
      `/api/v1/events/${encodeURIComponent(id)}`,
    );
    return {
      data: { ...data, ...normalizeEvent(data) },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export type EventShareTarget = 'MASTODON' | 'BLUESKY';

async function transition(
  id: string,
  action: 'publish' | 'cancel',
  shareTo: EventShareTarget[] = [],
): Promise<Result<ArtistEvent>> {
  if (isForceMock()) {
    const row = mockEvents.find((event) => event.id === id);
    if (!row) {
      return { ok: false, error: 'Event not found' };
    }
    if (action === 'publish') {
      row.status = 'PUBLISHED';
      row.publishedAt = row.publishedAt ?? new Date().toISOString();
    } else {
      row.status = 'CANCELLED';
    }
    return { ok: true, data: { ...row } };
  }
  try {
    const { data } = await requestJson<ArtistEvent>(
      `/api/me/events/${encodeURIComponent(id)}/${action}`,
      action === 'publish'
        ? { method: 'POST', body: JSON.stringify({ shareTo }) }
        : { method: 'POST' },
    );
    return { ok: true, data: normalizeEvent(data) };
  } catch (err) {
    return {
      ok: false,
      error: errorText(
        err,
        action === 'publish'
          ? 'Could not publish the event'
          : 'Could not cancel the event',
      ),
    };
  }
}

/** Publish a draft (followers and accepted tags are told) or re-publish a
 * cancelled event. */
export function publishEvent(id: string, shareTo: EventShareTarget[] = []) {
  return transition(id, 'publish', shareTo);
}

/** Cancel a published event; it stays listed with a Cancelled badge. */
export function cancelEvent(id: string) {
  return transition(id, 'cancel');
}

export type EventParticipantInput = { username: string; role: ArtistEventRole };

/** Replace who is tagged on an event. New tags get an invite to accept. */
export async function setEventParticipants(
  id: string,
  participants: EventParticipantInput[],
): Promise<Result<ArtistEvent>> {
  if (isForceMock()) {
    const row = mockEvents.find((event) => event.id === id);
    if (!row) {
      return { ok: false, error: 'Event not found' };
    }
    row.participants = participants.map((p) => {
      const existing = row.participants.find((e) => e.username === p.username);
      return {
        username: p.username,
        displayName: existing?.displayName ?? p.username,
        avatarUrl: existing?.avatarUrl ?? null,
        channelSlug: existing?.channelSlug ?? null,
        role: p.role,
        status: existing?.status ?? 'PENDING',
      };
    });
    return { ok: true, data: { ...row } };
  }
  try {
    const { data } = await requestJson<ArtistEvent>(
      `/api/me/events/${encodeURIComponent(id)}/participants`,
      { method: 'PUT', body: JSON.stringify({ participants }) },
    );
    return { ok: true, data: normalizeEvent(data) };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not save the tags') };
  }
}

const mockInvites: EventInvite[] = [
  {
    event: normalizeEvent({
      id: 'evt-invite-1',
      title: 'Kaiku Collective night',
      description: 'Six producers, one long night.',
      place: 'Vanha Kutomo',
      location: 'Turku, Finland',
      startAt: '2026-12-05T19:00:00.000Z',
      status: 'PUBLISHED',
    }),
    host: {
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
    },
    role: 'PERFORMER',
    status: 'PENDING',
  },
];

/** Events other artists tagged you on (`GET /api/me/event-invites`). */
export async function fetchEventInvites(): Promise<{
  data: EventInvite[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockInvites.map((invite) => ({ ...invite })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EventInvite[]>('/api/me/event-invites');
    return {
      data: Array.isArray(data)
        ? data.map((invite) => ({
            ...invite,
            event: normalizeEvent(invite.event),
          }))
        : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Accept or decline a tag. Accepted events list on your channel too. */
export async function answerEventInvite(
  eventId: string,
  answer: 'accept' | 'decline',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const invite = mockInvites.find((row) => row.event.id === eventId);
    if (invite) {
      invite.status = answer === 'accept' ? 'ACCEPTED' : 'DECLINED';
    }
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/event-invites/${encodeURIComponent(eventId)}/${answer}`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not answer the invite') };
  }
}

/** Subscribe link for the whole calendar, or one artist's events. */
export function eventsIcsUrl(username?: string): string {
  const path = username
    ? `/api/v1/u/${encodeURIComponent(username)}/events.ics`
    : '/api/v1/events.ics';
  return new URL(`${apiBase()}${path}`, window.location.origin).href;
}

function icsStamp(iso: string) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** "Add to Google Calendar" link for one event. */
export function googleCalendarUrl(event: {
  title: string;
  startAt: string;
  endAt: string | null;
  place: string;
  location: string;
  description: string;
}): string {
  const end =
    event.endAt ??
    new Date(new Date(event.startAt).getTime() + 2 * 3_600_000).toISOString();
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${icsStamp(event.startAt)}/${icsStamp(end)}`,
    location: [event.place, event.location].filter(Boolean).join(', '),
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export type EventShare = {
  id: string;
  platform: EventShareTarget;
  state: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

const mockShares = new Map<string, EventShare[]>([
  [
    'evt-mock-2',
    [
      {
        id: 'share-mock-1',
        platform: 'MASTODON',
        state: 'SENT',
        error: null,
        createdAt: '2026-08-01T10:00:00.000Z',
        sentAt: '2026-08-01T10:01:00.000Z',
      },
      {
        id: 'share-mock-2',
        platform: 'BLUESKY',
        state: 'FAILED',
        error: 'Bluesky session expired',
        createdAt: '2026-08-01T10:00:00.000Z',
        sentAt: null,
      },
    ],
  ],
]);

/** Where an event was announced and how it went
 * (`GET /api/me/events/:id/shares`). */
export async function fetchEventShares(id: string): Promise<{
  data: EventShare[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: (mockShares.get(id) ?? []).map((share) => ({ ...share })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EventShare[]>(
      `/api/me/events/${encodeURIComponent(id)}/shares`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Send a failed announcement again. */
export async function retryEventShare(
  eventId: string,
  shareId: string,
): Promise<Result<EventShare>> {
  if (isForceMock()) {
    const share = mockShares.get(eventId)?.find((row) => row.id === shareId);
    if (!share) {
      return { ok: false, error: 'Share not found' };
    }
    share.state = 'PENDING';
    share.error = null;
    return { ok: true, data: { ...share } };
  }
  try {
    const { data } = await requestJson<EventShare>(
      `/api/me/events/${encodeURIComponent(eventId)}/shares/${encodeURIComponent(shareId)}/retry`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not retry') };
  }
}
