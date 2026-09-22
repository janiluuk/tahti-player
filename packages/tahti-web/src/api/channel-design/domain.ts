import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      available: slug.length >= 3 && slug !== 'taken',
      reason: slug === 'taken' ? 'taken' : undefined,
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<{ available: boolean; reason?: string }>(
      `/api/me/channel/slug-available?slug=${encodeURIComponent(slug)}`,
    );
    return { ...data, meta: { source: 'api' } };
  } catch (err) {
    return { available: false, reason: 'error', meta: failMeta(err) };
  }
}

export async function updateChannelSlug(
  slug: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (slug.length < 3) {
      return { ok: false, error: 'Slug too short' };
    }
    return { ok: true, slug };
  }
  try {
    const { data } = await requestJson<{ slug?: string; username?: string }>(
      '/api/me/channel/slug',
      { method: 'PATCH', body: JSON.stringify({ slug }) },
    );
    return { ok: true, slug: data.slug ?? slug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Rename failed',
    };
  }
}

export async function setCustomDomain(
  domain: string,
): Promise<
  | { ok: true; domain: string; txtHost: string; txtRecord: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      domain,
      txtHost: `_tahti.${domain}`,
      txtRecord: 'tahti-verify=mock-token',
    };
  }
  try {
    const { data } = await requestJson<{
      domain: string;
      txtHost: string;
      txtRecord: string;
    }>('/api/me/channel/custom-domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Set domain failed',
    };
  }
}

export async function verifyCustomDomain(): Promise<
  { ok: true; verified: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, verified: true };
  }
  try {
    const { data } = await requestJson<{ verified?: boolean; ok?: boolean }>(
      '/api/me/channel/custom-domain/verify',
      { method: 'POST' },
    );
    return { ok: true, verified: Boolean(data.verified ?? data.ok) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verify failed',
    };
  }
}
