import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runDiscussionsList, runDiscussionsShow } from './discussions.mjs';

const TOPIC = {
  id: 'topic-1',
  title: 'Festival stage 2027',
  body: 'Who plays?',
  status: 'OPEN',
  pinned: true,
  createdBy: 'Mart Saar',
  postCount: 2,
  lastPostAt: '2026-10-20T10:00:00.000Z',
  createdAt: '2026-10-19T10:00:00.000Z',
  following: true,
  muted: false,
  unreadCount: 1,
};

describe('tahti discussions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists topics with replies, new replies and state', async () => {
    const fetchMock = mockFetchJson({ topics: [TOPIC] });
    const output = await runDiscussionsList(TEST_CONFIG);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/governance/discussions',
    );
    expect(output).toContain('topic-1');
    expect(output).toContain('Festival stage 2027');
    expect(output).toContain('pinned, following');
  });

  it('says when there are none', async () => {
    mockFetchJson({ topics: [] });
    expect(await runDiscussionsList(TEST_CONFIG)).toBe(
      'The board has not opened any discussions yet.',
    );
  });

  it('shows a topic and its replies, never an email as a name', async () => {
    const fetchMock = mockFetchJson({
      ...TOPIC,
      posts: [
        {
          id: '7',
          body: 'An ambient set?',
          author: 'liis@example.com',
          createdAt: '2026-10-20T10:00:00.000Z',
        },
      ],
    });
    const output = await runDiscussionsShow(TEST_CONFIG, 'topic-1');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/governance/discussions/topic-1',
    );
    expect(output).toContain('Who plays?');
    expect(output).toContain('--- 1 reply ---');
    expect(output).toContain('An ambient set?');
    expect(output).toContain('a member');
    expect(output).not.toContain('@example.com');
  });

  it('needs a topic id', async () => {
    await expect(runDiscussionsShow(TEST_CONFIG, '')).rejects.toThrow(
      'Give a topic id',
    );
  });
});
