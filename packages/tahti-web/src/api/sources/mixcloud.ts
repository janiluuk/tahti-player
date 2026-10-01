import { apiBase } from '../http';
import { installMeIntegration } from '../integrations';
import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

export type MixcloudCloudcast = {
  url: string;
  title: string;
  username: string;
  displayName: string;
  durationSec: number;
  coverUrl: string | null;
  genre: string | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const MOCK_CLOUDCAST: MixcloudCloudcast = {
  url: 'https://www.mixcloud.com/mockartist/sunday-selector/',
  title: 'Sunday Selector',
  username: 'mockartist',
  displayName: 'Mock Artist',
  durationSec: 3600,
  coverUrl: null,
  genre: 'house',
};

async function list(path: string): Promise<Result<MixcloudCloudcast[]>> {
  if (isForceMock()) {
    return { ok: true, data: [MOCK_CLOUDCAST] };
  }
  try {
    const { data } = await requestJson<{ tracks: MixcloudCloudcast[] }>(path);
    return { ok: true, data: data.tracks };
  } catch (err) {
    return { ok: false, error: message(err, 'Mixcloud lookup failed') };
  }
}

export const searchMixcloud = (q: string) =>
  list(`/api/v1/imports/mixcloud/search?q=${encodeURIComponent(q)}`);

export const fetchMyMixcloudCloudcasts = () =>
  list('/api/v1/imports/mixcloud/me-tracks');

export const fetchMixcloudProfileCloudcasts = (profileUrl: string) =>
  list(
    `/api/v1/imports/mixcloud/by-username?profileUrl=${encodeURIComponent(profileUrl)}`,
  );

/** Mixcloud's CDN is reached through the API so the artist's IP never hits it. */
export const mixcloudCoverUrl = (coverUrl: string) =>
  `${apiBase()}/api/v1/imports/mixcloud/cover?url=${encodeURIComponent(coverUrl)}`;

/** Adds an embed-only Sound for the cloudcast to the collection. The API
 * needs a `mixcloud-import` credential, which has no fields, so it is
 * upserted first. */
export async function addMixcloudCloudcast(
  collectionId: string,
  cloudcastUrl: string,
): Promise<Result<{ soundId: string }>> {
  if (isForceMock()) {
    return { ok: true, data: { soundId: `mixcloud-${cloudcastUrl}` } };
  }
  const installed = await installMeIntegration('mixcloud-import', {});
  if (!installed.ok) {
    return installed;
  }
  try {
    const { data } = await requestJson<{ soundId: string }>(
      '/api/v1/imports/mixcloud/add',
      {
        method: 'POST',
        body: JSON.stringify({ collectionId, cloudcastUrl }),
      },
    );
    return { ok: true, data: { soundId: data.soundId } };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not add the cloudcast') };
  }
}
