import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
  it("copies the artist's sound feed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ArtistHeaderActions
        profile={profile('https://api.tahti.live/api/v1/u/selector/rss.xml')}
        isOwner
        onEditLook={() => undefined}
      />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: "Copy the RSS feed of Selector's sounds",
        }),
      );
    });
    expect(writeText).toHaveBeenCalledWith(
      'https://api.tahti.live/api/v1/u/selector/rss.xml',
    );
  });

  it('hides the button without a channel feed', () => {
    render(
      <ArtistHeaderActions
        profile={profile(null)}
        isOwner
        onEditLook={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: /RSS feed/ })).toBeNull();
  });
});
