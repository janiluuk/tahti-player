import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PublicProfile } from '../../api/types';
import { ArtistHeaderActions } from './ArtistProfileSections';

const profile = (sound: string | null) =>
  ({
    artist: { username: 'selector', displayName: 'Selector' },
    channel: null,
    fanTiers: [],
    links: {
      channel: null,
      subscribe: '',
      feeds: { sound },
      presskit: '',
    },
  }) as unknown as PublicProfile;

describe('ArtistHeaderActions RSS feed', () => {
  it("links the artist's sound feed", () => {
    render(
      <ArtistHeaderActions
        profile={profile('https://api.tahti.live/api/v1/u/selector/rss.xml')}
        isOwner
        onEditLook={() => undefined}
      />,
    );
    const link = screen.getByRole('link', {
      name: "RSS feed of Selector's sounds",
    });
    expect(link.getAttribute('href')).toBe(
      'https://api.tahti.live/api/v1/u/selector/rss.xml',
    );
    expect(link.getAttribute('type')).toBe('application/rss+xml');
  });

  it('hides the button without a channel feed', () => {
    render(
      <ArtistHeaderActions
        profile={profile(null)}
        isOwner
        onEditLook={() => undefined}
      />,
    );
    expect(screen.queryByRole('link', { name: /RSS feed/ })).toBeNull();
  });
});
