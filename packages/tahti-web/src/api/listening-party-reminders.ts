import type { FetchMeta } from './client';
import { onMockOverridesReset } from './mock-overrides';
import { apiErrorMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type PartyReminder = { reminded: boolean; count: number };

const mockReminded = new Set<string>();
const MOCK_OTHERS = 12;

onMockOverridesReset(() => {
  mockReminded.clear();
});

function mockState(partyId: string): PartyReminder {
  const reminded = mockReminded.has(partyId);
  return { reminded, count: MOCK_OTHERS + (reminded ? 1 : 0) };
}

function reminderPath(partyId: string) {
  return `/api/v1/listening-parties/${encodeURIComponent(partyId)}/reminder`;
}

/** How many people asked to be reminded of a party, and whether you did. */
export async function fetchPartyReminder(
  partyId: string,
): Promise<{ data: PartyReminder | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockState(partyId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PartyReminder>(reminderPath(partyId));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

/** Ask to be reminded when the party starts (and told if it moves), or stop. */
export async function setPartyReminder(
  partyId: string,
  remind: boolean,
): Promise<{ ok: true; data: PartyReminder } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (remind) {
      mockReminded.add(partyId);
    } else {
      mockReminded.delete(partyId);
    }
    return { ok: true, data: mockState(partyId) };
  }
  try {
    const { data } = await requestJson<PartyReminder>(reminderPath(partyId), {
      method: remind ? 'POST' : 'DELETE',
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not update the reminder',
    };
  }
}
