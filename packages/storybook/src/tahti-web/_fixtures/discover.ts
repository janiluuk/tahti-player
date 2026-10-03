import type { SearchTrackResult, VenueProfile } from '@tahti-web/api/types';

import type { MockOverrides } from '../_lib/mock-data';

export const TAG = 'modular';
export const VENUE_SLUG = 'kuudes-linja';

const TAG_TRACKS: SearchTrackResult[] = [
  {
    id: 'northern-lights-archive-1',
    title: 'Aurora Drift',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    durationSec: 372,
    coverUrl: '/mock/northern-lights/cover-first-light.svg',
  },
  {
    id: 'dj-moonlight-archive-1',
    title: 'After Hours Drive',
    artistName: 'DJ Moonlight',
    channelSlug: 'dj-moonlight',
    durationSec: 284,
    coverUrl: '/mock/dj-moonlight/cover-after-hours.svg',
  },
  {
    id: 'kaiku-archive-2',
    title: 'Patch Cable Hymn',
    artistName: 'Kaiku Collective',
    channelSlug: 'kaiku',
    durationSec: null,
    coverUrl: null,
  },
];

export const tagTracksData: MockOverrides = { tagTracks: TAG_TRACKS };

function richVenue(base: VenueProfile | null): VenueProfile | null {
  if (!base) {
    return null;
  }
  return {
    ...base,
    description:
      'Two rooms and a courtyard in Sörnäinen. Club nights, live electronics and the occasional broadcast straight from the booth.',
    photos: [
      '/mock/northern-lights/cover-polar-static.svg',
      '/mock/dj-moonlight/cover-moonlight-drive.svg',
    ],
    broadcasts: [
      {
        id: 'venue-show-1',
        startAt: '2099-02-14T19:30:00.000Z',
        endAt: '2099-02-14T23:00:00.000Z',
        description: 'Northern Lights - Polar Static live',
      },
      {
        id: 'venue-show-2',
        startAt: '2099-03-01T21:00:00.000Z',
        endAt: null,
        description: 'DJ Moonlight - after hours broadcast',
      },
    ],
    recordings: [
      {
        id: 'northern-lights-archive-2',
        title: 'Midnight Broadcast (live at Kuudes Linja)',
        artistName: 'Northern Lights',
        channelSlug: 'northern-lights',
        durationSec: 541,
        coverUrl: '/mock/northern-lights/cover-first-light.svg',
        releasedAt: '2026-09-20T00:00:00.000Z',
      },
      {
        id: 'dj-moonlight-archive-3',
        title: 'Booth Tape 07',
        artistName: 'DJ Moonlight',
        channelSlug: 'dj-moonlight',
        durationSec: null,
        coverUrl: null,
        releasedAt: '2026-08-02T00:00:00.000Z',
      },
    ],
  };
}

/** Photos, booked shows and "Recorded here" tracks. */
export const venueRichData: MockOverrides = {
  venueProfile: (base) => richVenue(base),
};

export const venueBareData: MockOverrides = {
  venueProfile: (base) =>
    base
      ? {
          ...base,
          description: null,
          photos: [],
          broadcasts: [],
          recordings: [],
        }
      : null,
};
