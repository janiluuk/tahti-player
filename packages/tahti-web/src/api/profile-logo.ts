import { isForceMock } from './mode';
import { requestJson } from './request-json';
import type { LogoPlacement } from './studio-extras/profile';

const LOGO_TYPES = ['image/png', 'image/webp'];

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const patchProfile = (body: Record<string, unknown>) =>
  requestJson('/api/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

/** Transparent logo drawn over the avatar and/or cover (`User.logoUrl`). */
export async function uploadProfileLogo(
  file: File,
): Promise<Result<{ logoUrl: string }>> {
  const contentType = file.type;
  if (!LOGO_TYPES.includes(contentType)) {
    return {
      ok: false,
      error: 'Use PNG or WebP so the logo keeps its transparency',
    };
  }
  if (isForceMock()) {
    return { ok: true, data: { logoUrl: URL.createObjectURL(file) } };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/profile/logo/prepare', {
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
    const { data } = await requestJson<{ logoUrl: string | null }>(
      '/api/me/profile/logo/complete',
      { method: 'POST', body: JSON.stringify({ uploadKey: prep.uploadKey }) },
    );
    if (!data.logoUrl) {
      throw new Error('The logo was saved but has no URL yet');
    }
    return { ok: true, data: { logoUrl: data.logoUrl } };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not upload the logo') };
  }
}

export async function setProfileLogoPlacement(
  logoPlacement: LogoPlacement,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await patchProfile({ logoPlacement });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the placement') };
  }
}

export async function removeProfileLogo(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await patchProfile({ logoUrl: null });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not remove the logo') };
  }
}
