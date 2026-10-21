import { isForceMock } from './mode';
import { requestJson } from './request-json';

const BACKDROP_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/** The wide banner behind the artist page header (`User.backdropUrl`). */
export async function uploadProfileBackdrop(
  file: File,
): Promise<Result<{ backdropUrl: string }>> {
  const contentType = file.type || 'image/jpeg';
  if (!BACKDROP_TYPES.includes(contentType)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    return { ok: true, data: { backdropUrl: URL.createObjectURL(file) } };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/profile/backdrop/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status})`);
    }
    const { data } = await requestJson<{ backdropUrl: string | null }>(
      '/api/me/profile/backdrop/complete',
      { method: 'POST', body: JSON.stringify({ uploadKey: prep.uploadKey }) },
    );
    if (!data.backdropUrl) {
      throw new Error('The backdrop was saved but has no URL yet');
    }
    return { ok: true, data: { backdropUrl: data.backdropUrl } };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not upload the backdrop') };
  }
}

export async function removeProfileBackdrop(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ backdropUrl: null }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not remove the backdrop') };
  }
}
