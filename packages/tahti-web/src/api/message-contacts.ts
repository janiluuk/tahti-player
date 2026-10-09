import type { FetchMeta } from './client';
import { getJson } from './http';
import { mockFixture } from './mock-overrides';
import { failMeta, isForceMock } from './mode';

/** Someone you follow or who follows you, for starting a DM. */
export type MessageContact = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followsYou: boolean;
  followedByYou: boolean;
};

export async function fetchMessageContacts(): Promise<{
  data: MessageContact[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture('messageContacts', [
        {
          username: 'listener',
          displayName: 'Listener One',
          avatarUrl: null,
          followsYou: true,
          followedByYou: true,
        },
      ]),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MessageContact[]>('/api/me/messages/contacts');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
