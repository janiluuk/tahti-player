import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type PostCategory = 'STORY' | 'NEWS' | 'ANNOUNCEMENT';

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  STORY: 'Story',
  NEWS: 'News',
  ANNOUNCEMENT: 'Announcement',
};

export type CommunityStory = {
  id: string;
  category: PostCategory;
  title: string | null;
  excerpt: string;
  imageUrl: string | null;
  publishAt: string;
  /** Author profile path, `/u/<username>`. */
  url: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

const HOUR_MS = 3_600_000;

function mockStories(): CommunityStory[] {
  const at = (hoursAgo: number) =>
    new Date(Date.now() - hoursAgo * HOUR_MS).toISOString();
  return [
    {
      id: 'mock-story-1',
      category: 'NEWS',
      title: 'My journey: the story behind the mixes',
      excerpt:
        'A name given under a tree, a laptop that overheated, and a love for music that refused to die.',
      imageUrl: '/artwork-presets/artwork-05.webp',
      publishAt: at(26),
      url: '/u/northern-lights',
      author: {
        username: 'northern-lights',
        displayName: 'Northern Lights',
        avatarUrl: '/mock/northern-lights/cover-first-light.svg',
      },
    },
    {
      id: 'mock-story-2',
      category: 'STORY',
      title: 'Hi, I make the flutes you hear here',
      excerpt:
        'I make native-style flutes by hand and record music with them. A short hello and what you will find on this page.',
      imageUrl: '/artwork-presets/artwork-11.webp',
      publishAt: at(30),
      url: '/u/resonant-crafts',
      author: {
        username: 'resonant-crafts',
        displayName: 'Resonant Crafts',
        avatarUrl: null,
      },
    },
    {
      id: 'mock-story-3',
      category: 'ANNOUNCEMENT',
      title: 'Thank you - 15000+ listens and 2000+ downloads',
      excerpt:
        'Dear people of online sonic adventures, thanks for your support. I hope you are enjoying every drop of the mixes.',
      imageUrl: null,
      publishAt: at(24 * 3),
      url: '/u/dj-moonlight',
      author: {
        username: 'dj-moonlight',
        displayName: 'DJ Moonlight',
        avatarUrl: '/mock/dj-moonlight/avatar.svg',
      },
    },
  ];
}

/** Newest published posts from every artist (`GET /api/v1/community/stories`). */
export async function fetchCommunityStories(limit = 12): Promise<{
  data: CommunityStory[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockStories(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { items } = await getJson<{
      items: CommunityStory[];
      nextCursor: string | null;
    }>(`/api/v1/community/stories?limit=${limit}`);
    return {
      data: Array.isArray(items) ? items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type CommunityStoryDetail = CommunityStory & {
  body: string;
  images: string[];
  linkUrl: string | null;
  linkLabel: string | null;
};

const MOCK_BODIES: Record<string, string> = {
  'mock-story-1':
    'A name given under a tree, a laptop that overheated, and a love for music that refused to die.\n\nThe first mixes were recorded on a borrowed controller in a kitchen. Some of them are still on this page, rough edges and all.\n\nThank you for listening along the way.',
  'mock-story-2':
    'I make native-style flutes by hand and record music with them.\n\nEvery flute starts as a branch from the forest behind the house. Here you will find the long improvisations, a few field recordings, and now and then a track with friends.',
  'mock-story-3':
    'Dear people of online sonic adventures, thanks for your support.\n\n15000+ listens and 2000+ downloads is far more than I imagined when I uploaded the first set. I hope you are enjoying every drop of the mixes.',
};

/** One story in full (`GET /api/v1/community/stories/:id`). */
export async function fetchCommunityStory(
  id: string,
): Promise<{ data: CommunityStoryDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const story = mockStories().find((item) => item.id === id);
    return {
      data: story
        ? {
            ...story,
            body: MOCK_BODIES[id] ?? story.excerpt,
            images: story.imageUrl ? [story.imageUrl] : [],
            linkUrl: null,
            linkLabel: null,
          }
        : null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<CommunityStoryDetail>(
      `/api/v1/community/stories/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
