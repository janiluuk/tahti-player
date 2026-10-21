import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import { requestJson } from './request-json';

/** GET /api/me/collection-subscriptions row. */
export type SubscribedCollection = {
  slug: string;
  name: string;
  type: string;
  coverUrl: string | null;
  itemCount: number;
  ownerUsername: string;
  ownerDisplayName: string;
  subscribedAt: string;
};

/** Collections you subscribed to, newest first. Signed-out listeners and
 * mock sessions get an empty list. */
export async function fetchSubscribedCollections(): Promise<{
  data: SubscribedCollection[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ items: SubscribedCollection[] }>(
      '/api/me/collection-subscriptions',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
