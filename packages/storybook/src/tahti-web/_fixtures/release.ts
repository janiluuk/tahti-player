import type { SmartLinkView } from '@tahti-web/api/types';

import type { MockOverrides } from '../_lib/mock-data';

export const SMART_LINK_SLUG = 'northern-lights-release-1';
export const RELEASE_TITLE = 'First Light EP';
export const LOCKED_TRACK_TITLE = 'Kaamos Bloom (Patron cut)';
export const MUSICBRAINZ_URL =
  'https://musicbrainz.org/release/5b11f4ce-a62d-471e-81fc-a69a8278c7da';
export const DISCOGS_URL = 'https://www.discogs.com/release/1234567';

/** Every key `SMART_LINK_SERVICES` accepts, in the order the API returns. */
export const ALL_DSP_TARGETS: Record<string, string> = {
  spotify: 'https://open.spotify.com/album/northern-lights-first-light',
  apple: 'https://music.apple.com/album/first-light/1700000000',
  tidal: 'https://tidal.com/browse/album/330000000',
  bandcamp: 'https://northernlights.bandcamp.com/album/first-light',
  soundcloud: 'https://soundcloud.com/northern-lights/sets/first-light',
  youtube: 'https://music.youtube.com/browse/MPREb_firstlight',
  deezer: 'https://www.deezer.com/album/500000000',
  amazon: 'https://music.amazon.com/albums/B0FIRSTLIGHT',
  mixcloud: 'https://www.mixcloud.com/northernlights/first-light-ep/',
};

function richSmartLink(base: SmartLinkView): SmartLinkView {
  const audioUrl =
    base.release.tracks?.find((track) => track.audioUrl)?.audioUrl ?? null;
  return {
    ...base,
    release: {
      ...base.release,
      title: RELEASE_TITLE,
      type: 'EP',
      genre: 'ambient',
      releaseDate: '2026-04-01T00:00:00.000Z',
      description:
        'Four tracks built from a winter of live broadcasts, recorded during actual aurora activity over Rovaniemi.',
      showPoweredByFooter: true,
      pLine: '℗ 2026 Northern Lights',
      cLine: '(c) 2026 Tahti Records',
      musicbrainzUrl: MUSICBRAINZ_URL,
      discogsUrl: DISCOGS_URL,
      tracks: [
        {
          id: 'first-light-track-1',
          soundId: 'northern-lights-archive-1',
          title: 'Aurora Drift',
          position: 1,
          durationSec: 372,
          audioUrl,
          credits: [
            {
              role: 'producer',
              name: 'Northern Lights',
              artistUsername: 'northern-lights',
            },
            { role: 'mastering', name: 'Saimaa Sound' },
          ],
        },
        {
          id: 'first-light-track-2',
          soundId: 'northern-lights-archive-2',
          title: 'Midnight Broadcast',
          position: 2,
          durationSec: 541,
          audioUrl,
          credits: [
            {
              role: 'vocals',
              name: 'DJ Moonlight',
              artistUsername: 'dj-moonlight',
            },
            // Dropped by the credit parser: email addresses never show as names.
            { role: 'mixing', name: 'engineer@example.com' },
          ],
        },
        {
          id: 'first-light-track-3',
          soundId: 'northern-lights-archive-3',
          title: 'Archive Session 02',
          position: 3,
          durationSec: 120,
          audioUrl,
        },
        {
          id: 'first-light-track-4',
          soundId: 'northern-lights-archive-4',
          title: LOCKED_TRACK_TITLE,
          position: 4,
          durationSec: 298,
          audioUrl: null,
          gate: { reason: 'SUBSCRIBERS_ONLY', tierId: 'tier-story-2' },
        },
      ],
    },
    targets: ALL_DSP_TARGETS,
  };
}

/** Playable and locked tracks, credits, rights lines, catalog links, every
 * DSP and the Powered-by footer. */
export const smartLinkRichData: MockOverrides = {
  smartLink: (base) => richSmartLink(base),
};

export const smartLinkNoFooterData: MockOverrides = {
  smartLink: (base) => {
    const data = richSmartLink(base);
    return {
      ...data,
      release: { ...data.release, showPoweredByFooter: false },
    };
  },
};

/** No DSP targets: the page falls back to a single "Tahti" link. */
export const smartLinkNoTargetsData: MockOverrides = {
  smartLink: (base) => ({ ...richSmartLink(base), targets: {} }),
};
