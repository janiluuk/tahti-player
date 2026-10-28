import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  runDiscussionsEdit,
  runDiscussionsFollow,
  runDiscussionsList,
  runDiscussionsMute,
  runDiscussionsReadAll,
  runDiscussionsReply,
  runDiscussionsShow,
} from './discussions.mjs';

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
  lastReplyBy: 'Liis Kask',
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
    expect(output).toContain('LAST REPLY');
    expect(output).toContain('Liis Kask');
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
    expect(output).toContain('--- 2 replies ---');
    expect(output).toContain('An ambient set?');
    expect(output).toContain('a member');
    expect(output).not.toContain('@example.com');
  });

  it('needs a topic id', async () => {
    await expect(runDiscussionsShow(TEST_CONFIG, '')).rejects.toThrow(
      'Give a topic id',
    );
  });

  it('replies with the words after the id', async () => {
    const fetchMock = mockFetchJson({ id: '9', body: 'Count me in' });
    const output = await runDiscussionsReply(TEST_CONFIG, 'topic-1', [
      'Count',
      'me',
      'in',
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.example.test/api/v1/governance/discussions/topic-1/posts',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ body: 'Count me in' });
    expect(output).toContain('#9');
  });

  it('needs reply text', async () => {
    await expect(
      runDiscussionsReply(TEST_CONFIG, 'topic-1', []),
    ).rejects.toThrow('Give the reply text');
  });

  it('follows and mutes', async () => {
    const fetchMock = mockFetchJson({ following: true, muted: false });
    expect(await runDiscussionsFollow(TEST_CONFIG, 'topic-1', true)).toContain(
      'Following',
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.example.test/api/v1/governance/discussions/topic-1/follow',
    );
    expect(init.method).toBe('PUT');
    mockFetchJson({ following: true, muted: true });
    expect(await runDiscussionsMute(TEST_CONFIG, 'topic-1', true)).toContain(
      'Muted',
    );
  });

  it('edits a reply by its number', async () => {
    const fetchMock = mockFetchJson({ id: '7', body: 'Fixed', editedAt: 'x' });
    expect(
      await runDiscussionsEdit(TEST_CONFIG, 'topic-1', '#7', ['Fixed']),
    ).toBe('Reply updated.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.example.test/api/v1/governance/discussions/topic-1/posts/7',
    );
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ body: 'Fixed' });
  });

  it('marks edited replies in show', async () => {
    mockFetchJson({
      ...TOPIC,
      posts: [
        {
          id: '7',
          body: 'Fixed',
          author: 'Aino',
          createdAt: '2026-10-20T10:00:00.000Z',
          editedAt: '2026-10-20T11:00:00.000Z',
        },
      ],
    });
    expect(await runDiscussionsShow(TEST_CONFIG, 'topic-1')).toContain(
      '(edited) (#7)',
    );
  });

  it('points at earlier replies and pages with --before', async () => {
    mockFetchJson({
      ...TOPIC,
      postCount: 101,
      hasEarlierPosts: true,
      posts: [
        {
          id: '12',
          body: 'Latest page',
          author: 'Aino',
          createdAt: '2026-10-20T10:00:00.000Z',
        },
      ],
    });
    const output = await runDiscussionsShow(TEST_CONFIG, 'topic-1');
    expect(output).toContain('--- 101 replies ---');
    expect(output).toContain('tahti discussions show topic-1 --before 12');

    const fetchMock = mockFetchJson({
      posts: [
        {
          id: '3',
          body: 'Early on',
          author: 'Liis',
          createdAt: '2026-10-19T10:00:00.000Z',
        },
      ],
      hasEarlierPosts: false,
    });
    const page = await runDiscussionsShow(TEST_CONFIG, 'topic-1', {
      before: '#12',
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/v1/governance/discussions/topic-1/posts?before=12',
    );
    expect(page).toContain('Early on');
    expect(page).not.toContain('--before');
  });

  it('rejects a --before that is not a reply number', async () => {
    await expect(
      runDiscussionsShow(TEST_CONFIG, 'topic-1', { before: 'abc' }),
    ).rejects.toThrow('--before takes a reply number');
  });

  it('marks every followed topic read', async () => {
    const fetchMock = mockFetchJson({ marked: 3 });
    expect(await runDiscussionsReadAll(TEST_CONFIG)).toBe(
      'Marked 3 topics read.',
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.example.test/api/v1/governance/discussions/read-all',
    );
    expect(init.method).toBe('POST');
  });
});
