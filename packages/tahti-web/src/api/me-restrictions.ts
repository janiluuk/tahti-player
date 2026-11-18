import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type RestrictionType = 'UPLOAD' | 'LIVE_SHOW_BOOKING' | 'LOGIN';

/** An active board restriction on the signed-in account
 * (`GET /api/me/restrictions`). */
export type MyRestriction = {
  type: RestrictionType;
  reason: string;
  expiresAt: string | null;
};

/** The account's active restrictions. A failed read gives none, so the
 * notice stays hidden and the API's own refusal still explains it. */
export async function fetchMyRestrictions(): Promise<MyRestriction[]> {
  if (isForceMock()) {
    return [];
  }
  try {
    const { data } = await requestJson<{ restrictions: MyRestriction[] }>(
      '/api/me/restrictions',
    );
    return Array.isArray(data.restrictions) ? data.restrictions : [];
  } catch {
    return [];
  }
}
