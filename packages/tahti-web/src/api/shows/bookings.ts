import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { mockBookings, setMockBookings } from './mock';
import { type ShowType, type StudioShowBooking } from './types';

export async function fetchShowBookings(
  from: string,
  to: string,
): Promise<{ data: StudioShowBooking[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockBookings.filter((b) => {
        const s = new Date(b.startAt).getTime();
        const e = new Date(b.endAt).getTime();
        return s < new Date(to).getTime() && e > new Date(from).getTime();
      }),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioShowBooking[]>(
      `/api/me/radio-slot-bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockBookings, meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createShowBooking(input: {
  startAt: string;
  endAt: string;
  note?: string;
  showType?: ShowType;
}): Promise<
  { ok: true; data: StudioShowBooking } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const booking: StudioShowBooking = {
      id: `booking-${Date.now()}`,
      startAt: input.startAt,
      endAt: input.endAt,
      note: input.note?.trim() || null,
      showType: input.showType ?? 'LIVE_SET',
      channelSlug: 'demo',
      username: 'demo',
      displayName: 'Demo Artist',
      isMine: true,
    };
    setMockBookings([...mockBookings, booking]);
    return { ok: true, data: booking };
  }
  try {
    const { data } = await requestJson<StudioShowBooking>(
      '/api/me/radio-slot-bookings',
      {
        method: 'POST',
        body: JSON.stringify({
          startAt: input.startAt,
          endAt: input.endAt,
          note: input.note,
          showType: input.showType ?? 'LIVE_SET',
        }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Booking failed',
    };
  }
}

export async function updateShowBooking(
  id: string,
  patch: { note?: string | null; showType?: ShowType },
): Promise<
  { ok: true; data: StudioShowBooking } | { ok: false; error: string }
> {
  if (isForceMock()) {
    let updated: StudioShowBooking | undefined;
    setMockBookings(
      mockBookings.map((b) => {
        if (b.id !== id) {
          return b;
        }
        updated = {
          ...b,
          ...(patch.note !== undefined ? { note: patch.note } : {}),
          ...(patch.showType !== undefined ? { showType: patch.showType } : {}),
        };
        return updated;
      }),
    );
    if (!updated) {
      return { ok: false, error: 'Booking not found' };
    }
    return { ok: true, data: updated };
  }
  try {
    const { data } = await requestJson<StudioShowBooking>(
      `/api/me/radio-slot-bookings/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function cancelShowBooking(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockBookings(mockBookings.filter((b) => b.id !== id));
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/radio-slot-bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cancel failed',
    };
  }
}
