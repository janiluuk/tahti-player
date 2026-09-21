import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { mockPress, setMockPress } from './mock';

export type PressKitMeta = {
  hasZip: boolean;
  bioShort: string;
  downloadPath: string | null;
  photoCount: number;
};

export async function fetchPressKitMeta(): Promise<{
  data: PressKitMeta;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockPress },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PressKitMeta>('/api/me/press-kit');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { ...mockPress, hasZip: false, downloadPath: null },
        meta: failMeta(err),
      };
    }
    return {
      data: { hasZip: false, bioShort: '', downloadPath: null, photoCount: 0 },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchPressKitBio(
  bioShort: string,
): Promise<{ ok: true; data: PressKitMeta } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockPress({ ...mockPress, bioShort });
    return { ok: true, data: { ...mockPress } };
  }
  try {
    const { data } = await requestJson<PressKitMeta>('/api/me/press-kit', {
      method: 'PATCH',
      body: JSON.stringify({ bioShort }),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
