import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { ACCEPTED_PRESS_KIT_TYPES } from './press-kit-images';

export async function uploadProfileAvatar(
  file: File,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const contentType = file.type || 'image/jpeg';
  if (!ACCEPTED_PRESS_KIT_TYPES.includes(contentType)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    const avatarUrl = URL.createObjectURL(file);
    return { ok: true, avatarUrl };
  }
  try {
    const { data: prepare } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/profile/avatar/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
    });
    const upload = await fetch(prepare.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!upload.ok) {
      throw new Error(`Upload PUT failed (${upload.status})`);
    }
    const { data } = await requestJson<{ avatarUrl: string }>(
      '/api/me/profile/avatar/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepare.uploadKey }),
      },
    );
    return { ok: true, avatarUrl: data.avatarUrl };
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
      body: JSON.stringify({ avatarUrl: '' }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Avatar removal failed',
    };
  }
}
