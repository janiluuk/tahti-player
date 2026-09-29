import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMessageContacts } from './message-contacts';

describe('fetchMessageContacts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the people you follow or who follow you', async () => {
    const contact = {
      username: 'fan',
      displayName: 'Fan',
      avatarUrl: null,
      followsYou: true,
      followedByYou: false,
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify([contact]), { status: 200 }),
      );
    await expect(fetchMessageContacts()).resolves.toMatchObject({
      data: [contact],
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/messages/contacts',
    );
  });

  it('is empty when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 401 }),
    );
    await expect(fetchMessageContacts()).resolves.toMatchObject({ data: [] });
  });
});
