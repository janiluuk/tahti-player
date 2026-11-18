import { firstFramePng } from '../../lib/gifPoster';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { ACCEPTED_PRESS_KIT_TYPES } from './press-kit-images';

/** Image types `/api/me/profile/avatar/prepare` accepts. */
const AVATAR_TYPES = [...ACCEPTED_PRESS_KIT_TYPES, 'image/gif'];

/** File input `accept` for the profile picture. */
export const AVATAR_UPLOAD_ACCEPT = AVATAR_TYPES.join(',');

function avatarContentType(file: File): string {
  if (file.type) {
    return file.type;
  }
  return file.name.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/jpeg';
}

/** Presigns and uploads one object under the caller's avatar prefix. */
async function putAvatarObject(
  filename: string,
  contentType: string,
  body: Blob,
): Promise<string> {
  const { data: prepare } = await requestJson<{
    uploadKey: string;
    uploadUrl: string;
  }>('/api/me/profile/avatar/prepare', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType }),
  });
  const upload = await fetch(prepare.uploadUrl, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType },
  });
  if (!upload.ok) {
    throw new Error(`Upload PUT failed (${upload.status})`);
  }
  return prepare.uploadKey;
}

/** Uploads a profile picture. An animated GIF also gets a still PNG of its
 * first frame, sent as `posterUploadKey`, so pages can show it at rest. */
export async function uploadProfileAvatar(
  file: File,
): Promise<
  | { ok: true; avatarUrl: string; avatarPosterUrl: string | null }
  | { ok: false; error: string }
> {
  const contentType = avatarContentType(file);
  if (!AVATAR_TYPES.includes(contentType)) {
    return { ok: false, error: 'Use JPEG, PNG, WebP, or GIF' };
  }
  let poster: Blob | null = null;
  if (contentType === 'image/gif') {
    try {
      poster = await firstFramePng(file);
    } catch {
      return { ok: false, error: 'Could not read the first frame of that GIF' };
    }
  }
  if (isForceMock()) {
    return {
      ok: true,
      avatarUrl: URL.createObjectURL(file),
      avatarPosterUrl: poster ? URL.createObjectURL(poster) : null,
    };
  }
  try {
    const uploadKey = await putAvatarObject(file.name, contentType, file);
    const posterUploadKey = poster
      ? await putAvatarObject('poster.png', 'image/png', poster)
      : undefined;
    const { data } = await requestJson<{
      avatarUrl: string;
      avatarPosterUrl?: string | null;
    }>('/api/me/profile/avatar/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadKey, posterUploadKey }),
    });
    return {
      ok: true,
      avatarUrl: data.avatarUrl,
      avatarPosterUrl: data.avatarPosterUrl ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Avatar upload failed',
    };
  }
}

export async function removeProfileAvatar(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    // avatarUrl.trim() || null on the server -- an empty string clears it.
    await requestJson('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: '', avatarPosterUrl: null }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Avatar removal failed',
    };
  }
}
