import type { FetchMeta } from '../client';
import { fetchShowBookings } from './bookings';
import { fetchPublicRadioSlots, type PublicRadioSlot } from './public-show';
import type { StudioShowBooking } from './types';

function publicSlotToBooking(slot: PublicRadioSlot): StudioShowBooking {
  return {
    id: slot.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
    note: slot.note,
    showType: slot.showType,
    channelSlug: slot.artist.channelSlug ?? slot.artist.username,
    username: slot.artist.username,
    displayName: slot.artist.displayName,
    coverUrl: slot.coverUrl,
    isMine: false,
  };
}

/** Booked Tahti Radio slots in `[from, to)`. Signed-in members read their
 * calendar (with `isMine`, so they can manage their own slots); everyone
 * else reads the public `GET /api/v1/radio/slots`, which needs no session. */
export async function fetchRadioCalendar(
  from: string,
  to: string,
  { signedIn }: { signedIn: boolean },
): Promise<{ data: StudioShowBooking[]; meta: FetchMeta }> {
  if (signedIn) {
    return fetchShowBookings(from, to);
  }
  const result = await fetchPublicRadioSlots(from, to);
  return { data: result.data.map(publicSlotToBooking), meta: result.meta };
}
