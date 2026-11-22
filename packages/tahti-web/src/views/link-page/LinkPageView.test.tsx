// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PublicProfile } from '../../api/types';
import { renderWithRouter } from '../../test/renderWithRouter';
import { LinkPageView } from './LinkPageView';

const profile: PublicProfile = {
  artist: {
    username: 'yaniho',
    displayName: 'Yaniho',
    bio: 'Bio text',
    fullBio: null,
    avatarUrl: null,
    defaultLocation: 'Helsinki, Finland',
  },
  channel: null,
  releases: [],
  tracks: [],
  fanTiers: [],
  collections: [],
  purchaseTiers: [],
  storePaymentsReady: false,
  links: {
    channel: null,
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
    ],
    sounds: [],
    sets: [],
    siteUrl: 'https://yaniho.tahti.live',
    linkPageUrl: 'https://tahti.live/u/yaniho',
  },
};

describe('LinkPageView', () => {
  it('renders the short link page hero and links', async () => {
    await renderWithRouter(
      <LinkPageView
        profile={profile}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId('link-page')).toBeTruthy();
    expect(screen.getByText('Yaniho')).toBeTruthy();
    expect(screen.getByText('Helsinki, Finland')).toBeTruthy();
    expect(screen.getByTestId('link-page-link')).toBeTruthy();
    expect(screen.getByText('Open profile')).toBeTruthy();
  });
});
