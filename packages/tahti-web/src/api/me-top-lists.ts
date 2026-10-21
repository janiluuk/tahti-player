import { isForceMock } from './mode';
import { requestJson } from './request-json';

let mockOptOut = false;

export async function fetchTopListsOptOut(): Promise<
  { ok: true; optOut: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, optOut: mockOptOut };
  }
  try {
    const { data } = await requestJson<{ topListsOptOut: boolean }>(
      '/api/me/top-lists-opt-out',
    );
    return { ok: true, optOut: data.topListsOptOut };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the setting',
    };
  }
}

export async function setTopListsOptOut(
  optOut: boolean,
): Promise<{ ok: true; optOut: boolean } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockOptOut = optOut;
    return { ok: true, optOut };
  }
  try {
    const { data } = await requestJson<{ topListsOptOut: boolean }>(
      '/api/me/top-lists-opt-out',
      { method: 'PATCH', body: JSON.stringify({ topListsOptOut: optOut }) },
    );
    return { ok: true, optOut: data.topListsOptOut };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the setting',
    };
  }
}
