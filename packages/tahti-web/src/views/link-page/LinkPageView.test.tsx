// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react';
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

  it('keeps the avatar inside its round frame', async () => {
    await renderWithRouter(
      <LinkPageView
        profile={profile}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    const frame = screen.getByTestId('link-page-avatar');
    // MediaArtwork fills its frame with absolute positioning; without a
    // positioned frame it covered the whole page.
    expect(frame.className).toContain('relative');
    expect(frame.className).toContain('overflow-hidden');
    expect(frame.querySelector('[data-testid="media-artwork"]')).toBeTruthy();
  });
  it('opens the artist site and sets in the app instead of reloading the page', async () => {
    const withSet: PublicProfile = {
      ...profile,
      linkPage: {
        ...profile.linkPage!,
        sets: [
          {
            id: 'vault',
            slug: 'vault',
            name: 'Vault',
            coverUrl: null,
            itemCount: 2,
            url: '/u/yaniho/c/vault',
          },
        ],
      },
    };
    const { router } = await renderWithRouter(
      <LinkPageView
        profile={withSet}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
      { paths: ['/u/$username', '/u/$username/c/$slug'] },
    );
    // An unpositioned frame let the fill artwork cover the whole page, so
    // every click landed on the set link.
    const setArtwork = screen
      .getByTestId('link-page-set')
      .querySelector('[data-testid="media-artwork"]');
    expect(setArtwork?.parentElement?.className).toContain('relative');
    const open = screen.getByRole('link', { name: 'Open profile' });
    expect(open.getAttribute('href')).toBe('/u/yaniho?full=1');
    await act(async () => {
      fireEvent.click(open);
    });
    expect(router.state.location.pathname).toBe('/u/yaniho');
    expect(router.state.location.searchStr).toBe('?full=1');
    await act(async () => {
      router.history.push('/');
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('link-page-set'));
    });
    expect(router.state.location.pathname).toBe('/u/yaniho/c/vault');
  });

  it('keeps links to other sites as plain links', async () => {
    await renderWithRouter(
      <LinkPageView
        profile={profile}
        loading={false}
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId('link-page-link').getAttribute('href')).toBe(
      'https://facebook.com/yaniho',
    );
  });
});
