// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/community-stories';
import { CommunityStoriesWidget } from './CommunityStoriesWidget';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    className,
  }: {
    children: unknown;
    className?: string;
  }) => <a className={className}>{children as never}</a>,
}));

const story: api.CommunityStory = {
  id: 's1',
  category: 'NEWS',
  title: 'Hi, I make the flutes you hear here',
  excerpt: 'A short hello.',
  imageUrl: null,
  publishAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  url: '/u/resonant',
  author: {
    username: 'resonant',
    displayName: 'Resonant Crafts',
    avatarUrl: null,
  },
};

describe('CommunityStoriesWidget', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows stories with category, age, title, excerpt and author', async () => {
    vi.spyOn(api, 'fetchCommunityStories').mockResolvedValue({
      data: [story],
      meta: { source: 'api' },
    });
    render(<CommunityStoriesWidget />);
    expect(await screen.findByText('shared news')).toBeTruthy();
    expect(screen.getByText('1 day ago')).toBeTruthy();
    expect(
      screen.getByText('Hi, I make the flutes you hear here'),
    ).toBeTruthy();
    expect(screen.getByText('A short hello.')).toBeTruthy();
    expect(screen.getByText('Resonant Crafts')).toBeTruthy();
  });

  it('says why it failed and offers a retry', async () => {
    vi.spyOn(api, 'fetchCommunityStories').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<CommunityStoriesWidget />);
    expect(
      await screen.findByText('Could not load community stories'),
    ).toBeTruthy();
  });

  it('falls back to the username when the display name is empty', async () => {
    vi.spyOn(api, 'fetchCommunityStories').mockResolvedValue({
      data: [{ ...story, author: { ...story.author, displayName: '' } }],
      meta: { source: 'api' },
    });
    render(<CommunityStoriesWidget />);
    expect(await screen.findByText('resonant')).toBeTruthy();
  });

  it('opens a story in a dialog with the other community updates', async () => {
    const second: api.CommunityStory = {
      ...story,
      id: 's2',
      title: 'Thank you for 2000 downloads',
      category: 'ANNOUNCEMENT',
    };
    vi.spyOn(api, 'fetchCommunityStories').mockResolvedValue({
      data: [story, second],
      meta: { source: 'api' },
    });
    const fetchStory = vi
      .spyOn(api, 'fetchCommunityStory')
      .mockImplementation(async (id) => ({
        data: {
          ...(id === 's1' ? story : second),
          body:
            id === 's1'
              ? 'First **bold** paragraph.\n\nSecond one.'
              : 'Thanks!',
          images: [],
          linkUrl: id === 's1' ? 'https://example.com' : null,
          linkLabel: id === 's1' ? 'Shop' : null,
        },
        meta: { source: 'api' },
      }));
    render(<CommunityStoriesWidget />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Hi, I make the flutes you hear here',
      }),
    );
    const dialog = await screen.findByTestId('community-story');
    expect(
      await within(dialog).findByText('First bold paragraph.'),
    ).toBeTruthy();
    expect(within(dialog).getByText('Second one.')).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: /Shop/ })).toBeTruthy();
    const more = within(dialog).getByRole('region', {
      name: 'More community updates',
    });
    fireEvent.click(
      within(more).getByRole('button', {
        name: /Thank you for 2000 downloads/,
      }),
    );
    expect(fetchStory).toHaveBeenLastCalledWith('s2');
    expect(await within(dialog).findByText('Thanks!')).toBeTruthy();
  });
});
