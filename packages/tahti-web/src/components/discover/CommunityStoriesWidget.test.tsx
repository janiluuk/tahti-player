// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
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
    render(<CommunityStoriesWidget onRemove={vi.fn()} />);
    expect(await screen.findByText('News · 1 day ago')).toBeTruthy();
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
    render(<CommunityStoriesWidget onRemove={vi.fn()} />);
    expect(
      await screen.findByText('Could not load community stories'),
    ).toBeTruthy();
  });

  it('falls back to the username when the display name is empty', async () => {
    vi.spyOn(api, 'fetchCommunityStories').mockResolvedValue({
      data: [{ ...story, author: { ...story.author, displayName: '' } }],
      meta: { source: 'api' },
    });
    render(<CommunityStoriesWidget onRemove={vi.fn()} />);
    expect(await screen.findByText('resonant')).toBeTruthy();
  });
});
