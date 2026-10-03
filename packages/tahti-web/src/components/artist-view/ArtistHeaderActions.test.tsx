import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PublicProfile } from '../../api/types';
import { ArtistHeaderActions } from './ArtistProfileSections';

const profile = (
  sound: string | null,
  channel: { slug: string } | null = null,
) =>
  ({
    artist: { username: 'selector', displayName: 'Selector' },
    channel,
    fanTiers: [],
    links: {
      channel: null,
      subscribe: '',
      feeds: { sound },
      presskit: '',
    },
  }) as unknown as PublicProfile;

afterEach(() => {
  cleanup();
});

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

async function renderInRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('ArtistHeaderActions report', () => {
  it("lets a visitor report the artist's channel", async () => {
    await renderInRouter(
      <ArtistHeaderActions
        profile={profile(null, { slug: 'selector' })}
        isOwner={false}
        onEditLook={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Report Selector' }),
    ).toBeTruthy();
  });

  it('hides the report button from the artist', async () => {
    await renderInRouter(
      <ArtistHeaderActions
        profile={profile(null, { slug: 'selector' })}
        isOwner
        onEditLook={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: /^Report/ })).toBeNull();
  });

  it('hides the report button when the artist has no channel', () => {
    render(
      <ArtistHeaderActions
        profile={profile(null)}
        isOwner={false}
        onEditLook={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: /^Report/ })).toBeNull();
  });
});
