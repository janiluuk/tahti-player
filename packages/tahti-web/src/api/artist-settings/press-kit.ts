import type { FetchMeta } from '.././client';
import { apiBase } from '.././http';
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

type ProfileBio = { username: string; bio?: string | null };

/** The press kit's short bio is the profile bio (`buildPressKit` in
 * tahti-org reads `User.bio`), and the ZIP is the public
 * `/api/v1/u/:username/press-kit.zip` (bio.txt plus the marked images). */
function pressKitFromProfile(profile: ProfileBio): PressKitMeta {
  return {
    hasZip: true,
    bioShort: profile.bio ?? '',
    downloadPath: `${apiBase()}/api/v1/u/${encodeURIComponent(profile.username)}/press-kit.zip`,
    photoCount: 0,
  };
}

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
    const { data } = await requestJson<ProfileBio>('/api/me/profile');
    return { data: pressKitFromProfile(data), meta: { source: 'api' } };
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
    const { data } = await requestJson<ProfileBio>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ bio: bioShort }),
    });
    return { ok: true, data: pressKitFromProfile(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
