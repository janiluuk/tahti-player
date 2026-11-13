import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import { getJson, sendJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ArtistEmbed = {
  id: string;
  provider: 'soundcloud';
  url: string;
  title: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};

let mockEmbeds: ArtistEmbed[] = [
  {
    id: 'mock-embed-1',
    provider: 'soundcloud',
    url: 'https://soundcloud.com/tahti/night-drive',
    title: 'Night Drive',
    authorName: 'Tahti',
    thumbnailUrl:
      'https://i1.sndcdn.com/artworks-mock-night-drive-t500x500.jpg',
    createdAt: '2026-09-01T12:00:00.000Z',
  },
];

export async function fetchArtistEmbeds(): Promise<{
  data: ArtistEmbed[] | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockEmbeds,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ArtistEmbed[]>('/api/me/embeds');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function addArtistEmbed(
  url: string,
): Promise<{ ok: true; data: ArtistEmbed } | { ok: false; error: string }> {
  if (isForceMock()) {
    const embed: ArtistEmbed = {
      id: `mock-embed-${Date.now()}`,
      provider: 'soundcloud',
      url,
      title: url.split('/').pop() ?? url,
      authorName: null,
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockEmbeds = [embed, ...mockEmbeds];
    return { ok: true, data: embed };
  }
  try {
    const data = await sendJson<ArtistEmbed>('/api/me/embeds', 'POST', {
      url,
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotAddTrack'),
    };
  }
}

export async function updateArtistEmbedThumbnail(
  id: string,
  thumbnailUrl: string,
): Promise<{ ok: true; data: ArtistEmbed } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockEmbeds = mockEmbeds.map((embed) =>
      embed.id === id ? { ...embed, thumbnailUrl } : embed,
    );
    const embed = mockEmbeds.find((row) => row.id === id);
    return embed
      ? { ok: true, data: embed }
      : { ok: false, error: i18n.t('web:batch53.embedNotFound') };
  }
  try {
    const data = await sendJson<ArtistEmbed>(
      `/api/me/embeds/${encodeURIComponent(id)}`,
      'PATCH',
      { thumbnailUrl },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotSaveCover'),
    };
  }
}

export async function removeArtistEmbed(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockEmbeds = mockEmbeds.filter((embed) => embed.id !== id);
    return { ok: true };
  }
  try {
    await sendJson(`/api/me/embeds/${encodeURIComponent(id)}`, 'DELETE');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotRemoveTrack'),
    };
  }
}
