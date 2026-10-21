import type { PublicRadioShow } from '@tahti-web/api/shows';

import type { MockOverrides } from '../_lib/mock-data';
import { isoFromNow } from './channel';

export const SHOW_SLUG = 'midnight-cartography';
export const SHOW_ARTIST = 'Midnight Cartography';
export const RECORDING_ID = 'mc-route-550-ep2';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const SHOW: PublicRadioShow = {
  artist: {
    displayName: SHOW_ARTIST,
    username: SHOW_SLUG,
    avatarUrl: null,
    channelSlug: SHOW_SLUG,
    bio: 'Late-night dub recorded riding the actual bus route.',
    coverUrl: null,
  },
  upcomingEpisodes: [
    {
      id: 'mc-next',
      startAt: isoFromNow(10 * MINUTE),
      endAt: isoFromNow(70 * MINUTE),
      note: 'Route 550 Live',
      showType: 'LIVE_SET',
      title: 'Route 550 Live - Episode 3',
      description: 'From Itäkeskus to Westend, mixed live from the back seat.',
    },
    {
      id: 'mc-later',
      startAt: isoFromNow(7 * DAY),
      endAt: isoFromNow(7 * DAY + HOUR),
      note: 'Listener call-ins',
      showType: 'TALK',
    },
  ],
  pastEpisodes: [
    {
      id: 'mc-past',
      startAt: isoFromNow(-7 * DAY),
      endAt: isoFromNow(-7 * DAY + HOUR),
      note: 'Route 550 Live',
      showType: 'LIVE_SET',
      title: 'Route 550 Live - Episode 2',
      recording: {
        soundId: RECORDING_ID,
        title: 'Route 550 Live - Episode 2',
        channelItemUrl: `/channel/${SHOW_SLUG}#archive-item-${RECORDING_ID}`,
      },
    },
  ],
  nextShowAt: null,
  lastShowAt: null,
};

export const radioShowRichData: MockOverrides = {
  radioShow: () => SHOW,
  radioShowNowPlaying: () => ({
    title: 'Westend Terminus',
    artistName: SHOW_ARTIST,
    artistUsername: SHOW_SLUG,
    artworkUrl: null,
    durationSec: 312,
    startedAt: isoFromNow(-MINUTE),
  }),
  radioShowUpcoming: () => [
    {
      id: 'up-1',
      title: 'Night Bus Dub',
      artistName: SHOW_ARTIST,
      artistUsername: SHOW_SLUG,
      artworkUrl: null,
    },
    {
      id: 'up-2',
      title: 'Kaamos Bloom',
      artistName: 'Saimaa Sessions',
      artistUsername: 'saimaa-sessions',
      artworkUrl: null,
    },
  ],
};

export const radioShowQuietData: MockOverrides = {
  radioShow: () => ({ ...SHOW, upcomingEpisodes: [], pastEpisodes: [] }),
  radioShowNowPlaying: () => null,
  radioShowUpcoming: () => [],
};

export const radioShowMissingData: MockOverrides = {
  radioShow: () => null,
};
