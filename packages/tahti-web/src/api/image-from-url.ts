import { isForceMock } from './mode';
import { requestJson } from './request-json';

type ImageResult = { ok: true; url: string } | { ok: false; error: string };

const failed = (err: unknown): ImageResult => ({
  ok: false,
  error: err instanceof Error ? err.message : 'Could not use that image',
});

/** The API downloads the image itself, so it has to be publicly reachable;
 * a page URL or an unsupported type comes back as a 422 with the reason. */
export async function setReleaseArtworkFromUrl(
  releaseId: string,
  sourceUrl: string,
): Promise<ImageResult> {
  if (isForceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ artworkUrl: string | null }>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/artwork/from-url`,
      { method: 'POST', body: JSON.stringify({ sourceUrl }) },
    );
    if (!data.artworkUrl) {
      throw new Error('The artwork was saved but has no URL yet');
    }
    return { ok: true, url: data.artworkUrl };
  } catch (err) {
    return failed(err);
  }
}

export async function setCollectionCoverFromUrl(
  slug: string,
  sourceUrl: string,
): Promise<ImageResult> {
  if (isForceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ url: string | null }>(
      `/api/me/collections/${encodeURIComponent(slug)}/cover/from-url`,
      { method: 'POST', body: JSON.stringify({ sourceUrl }) },
    );
    if (!data.url) {
      throw new Error('The cover was saved but has no URL yet');
    }
    return { ok: true, url: data.url };
  } catch (err) {
    return failed(err);
  }
}

export async function setProfileAvatarFromUrl(
  sourceUrl: string,
): Promise<ImageResult> {
  if (isForceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ avatarUrl: string }>(
      '/api/me/profile/avatar/from-url',
      { method: 'POST', body: JSON.stringify({ sourceUrl }) },
    );
    return { ok: true, url: data.avatarUrl };
  } catch (err) {
    return failed(err);
  }
}

export async function setChannelMemberPictureFromUrl(
  memberId: string,
  sourceUrl: string,
): Promise<ImageResult> {
  if (isForceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/me/channel/members/${encodeURIComponent(memberId)}/picture/from-url`,
      { method: 'POST', body: JSON.stringify({ sourceUrl }) },
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return failed(err);
  }
}
