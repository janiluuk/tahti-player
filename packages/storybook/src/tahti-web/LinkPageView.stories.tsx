import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PublicProfile } from '@tahti-web/api/types';
import { LinkPageView } from '@tahti-web/views/link-page/LinkPageView';

import { withTahtiRouter } from './_lib/decorators';

const profile: PublicProfile = {
  artist: {
    username: 'yaniho',
    displayName: 'Yaniho',
    bio: 'Hobbyist DJ, Producer & Organizer from Helsinki.',
    fullBio: null,
    avatarUrl: null,
    defaultLocation: 'Helsinki, Finland',
    countryCode: 'FI',
    socialLinks: {
      facebook: 'https://facebook.com/yaniho',
      website: 'https://example.com',
    },
  },
  channel: { slug: 'yaniho', state: 'OFFLINE' },
  releases: [],
  tracks: [],
  fanTiers: [],
  collections: [],
  purchaseTiers: [],
  storePaymentsReady: false,
  links: {
    channel: 'https://yaniho.tahti.live/channel/yaniho',
    subscribe: '/u/yaniho/subscribe',
    feeds: { sound: null },
    presskit: '',
  },
  linkPage: {
    playMode: 'inline',
    links: [
      {
        key: 'facebook',
        label: 'Facebook',
        url: 'https://facebook.com/yaniho',
        source: 'profile',
      },
      {
        key: 'own:1',
        label: 'Linkr',
        url: 'https://linkr.bio/yaniho',
        source: 'own',
        id: '1',
      },
    ],
    sounds: [
      {
        id: 's1',
        title: 'Trance set @ Manga Club',
        coverUrl: null,
        durationSec: 3600,
        playUrl: 'https://example.com/a.mp3',
        badge: null,
      },
    ],
    sets: [
      {
        id: 'c1',
        slug: '2026-sets',
        name: '2026 sets',
        coverUrl: null,
        itemCount: 4,
        url: '/u/yaniho/c/2026-sets',
      },
    ],
    siteUrl: 'https://yaniho.tahti.live',
    linkPageUrl: 'https://tahti.live/u/yaniho',
  },
};

const meta = {
  title: 'Tahti/Artist/LinkPageView',
  component: LinkPageView,
  decorators: [withTahtiRouter('/u/yaniho')],
  parameters: { layout: 'padded' },
  args: {
    profile,
    loading: false,
    error: null,
    onRetry: () => undefined,
  },
} satisfies Meta<typeof LinkPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Loading: Story = {
  args: { profile: null, loading: true },
};
