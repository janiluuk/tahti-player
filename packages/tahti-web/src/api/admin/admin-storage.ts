import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Storage ─────────────────────────────────────────────────────────────────

export type AdminStorageUserRow = {
  userId: string;
  username: string;
  displayName: string;
  quotaBytes: number;
  usedBytes: number;
  /** Paying/association-member accounts report unlimited storage — resolved
   * server-side (see AdminStorageUsageRowSchema in tahti-org); render as-is,
   * never re-derive from tier client-side. */
  unlimited: boolean;
};

/** Free/used/total for a physical or billed storage backend. `totalBytes`/
 * `freeBytes` are `null` when the backend has no fixed capacity to report
 * (a usage-billed object store) or the reading failed (host statfs error);
 * `note` carries the human-readable reason in that case. */
export type AdminStorageDiskSpace = {
  totalBytes: number | null;
  freeBytes: number | null;
  usedBytes: number | null;
  note: string | null;
};

export type AdminStorageOverview = {
  totalQuotaBytes: number;
  totalUsedBytes: number;
  userCount: number;
  users: AdminStorageUserRow[];
  /** The API host's local disk — also what the object-storage hot/streaming
   * cache lives on. */
  localDisk: AdminStorageDiskSpace;
  /** The object-storage backend (MinIO/S3-compatible). Billed by usage on
   * some providers, so totalBytes/freeBytes can be null even when usedBytes
   * is a real, tracked figure. */
  objectStorage: AdminStorageDiskSpace;
};

function mockStorageOverview(): AdminStorageOverview {
  const users: AdminStorageUserRow[] = [
    {
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 412 * 1024 * 1024,
      unlimited: false,
    },
    {
      userId: 'u-2',
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 538 * 1024 * 1024,
      unlimited: false,
    },
    {
      userId: 'u-3',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      quotaBytes: 1024 * 1024 * 1024,
      usedBytes: 201 * 1024 * 1024,
      // ARTIST-tier/association-member account — the backend resolves this
      // to unlimited storage regardless of the numeric quotaBytes above.
      unlimited: true,
    },
    {
      userId: 'u-4',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 89 * 1024 * 1024,
      unlimited: false,
    },
  ];
  const totalUsedBytes = users.reduce((s, u) => s + u.usedBytes, 0);
  return {
    totalQuotaBytes: users.reduce((s, u) => s + u.quotaBytes, 0),
    totalUsedBytes,
    userCount: users.length,
    users,
    localDisk: {
      totalBytes: 500 * 1024 ** 3,
      freeBytes: 120 * 1024 ** 3,
      usedBytes: 380 * 1024 ** 3,
      note: null,
    },
    objectStorage: {
      totalBytes: null,
      freeBytes: null,
      usedBytes: totalUsedBytes,
      note: 'Object storage is billed by usage, not a fixed volume — there is no total/free to report.',
    },
  };
}

let mockStorageState: AdminStorageOverview | null = null;

export async function fetchAdminStorage(): Promise<{
  data: AdminStorageOverview | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    if (!mockStorageState) {
      mockStorageState = mockStorageOverview();
    }
    return {
      data: mockStorageState,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStorageOverview>('/api/admin/storage');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export function setUserStorageQuota(userId: string, quotaBytes: number) {
  if (isForceMock()) {
    const row = mockStorageState?.users.find((u) => u.userId === userId);
    if (row) {
      row.quotaBytes = quotaBytes;
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/storage/${encodeURIComponent(userId)}/quota`,
    'PATCH',
    {
      quotaBytes,
    },
  );
}

// ── Storage: per-user file drill-down ───────────────────────────────────────

export type AdminStorageUserFile = {
  id: string;
  kind: 'sound' | 'stash';
  title: string;
  sizeBytes: number | null;
  createdAt: string;
  contentType: string | null;
  isPublic: boolean | null;
  /** Gates the play button — never inferred client-side, the backend already
   * knows which content types/formats are audio. */
  isAudio: boolean;
  previewUrl: string | null;
  /** Cumulative sizeBytes total up to and including this row (oldest-first). */
  runningTotalBytes: number;
};

export type AdminStorageUserDetail = {
  userId: string;
  username: string;
  displayName: string;
  tier: 'FREE' | 'ARTIST' | 'STUDIO';
  quotaBytes: number | null;
  usedBytes: number;
  unlimited: boolean;
  files: AdminStorageUserFile[];
};

function mockStorageUserDetail(userId: string): AdminStorageUserDetail | null {
  const row = (mockStorageState ?? mockStorageOverview()).users.find(
    (u) => u.userId === userId,
  );
  if (!row) {
    return null;
  }
  const files = (mockAdminFilesState ?? mockAdminFiles())
    .filter((f) => f.username === row.username)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  let running = 0;
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    tier: row.unlimited ? 'ARTIST' : 'FREE',
    quotaBytes: row.unlimited ? null : row.quotaBytes,
    usedBytes: row.usedBytes,
    unlimited: row.unlimited,
    files: files.map((f) => {
      running += f.sizeBytes ?? 0;
      return {
        id: f.id,
        kind: f.contentType === 'STASH' ? 'stash' : 'sound',
        title: f.title,
        sizeBytes: f.sizeBytes,
        createdAt: f.createdAt,
        contentType: f.contentType,
        isPublic: f.isPublic,
        isAudio: f.audioUrl != null,
        previewUrl: f.audioUrl,
        runningTotalBytes: running,
      };
    }),
  };
}

export async function fetchAdminStorageUserFiles(userId: string): Promise<{
  data: AdminStorageUserDetail | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockStorageUserDetail(userId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStorageUserDetail>(
      `/api/admin/storage/users/${encodeURIComponent(userId)}/files`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

// ── Files ───────────────────────────────────────────────────────────────────

export type AdminFileRow = {
  id: string;
  title: string;
  artistName: string;
  genre: string | null;
  contentType: string;
  isPublic: boolean;
  durationSec: number | null;
  sizeBytes: number | null;
  format: string | null;
  createdAt: string;
  channelSlug: string;
  userId: string;
  username: string;
  displayName: string;
  audioUrl: string | null;
  /** Count of SoundItemVersion rows — real, always populated by
   * /api/admin/files (../tahti/apps/api/src/routes/admin/files.ts). */
  revisionCount: number;
  /** ChannelSoundItem has no per-item R2-mirror field in the schema yet (unlike
   * ReleaseTrack/ReleaseTrackVersion, which do) — genuinely not tracked, not
   * just unwired here. Stays optional/undefined against the real API until
   * that schema + worker support exists; mock data fills it in for the UI. */
  storageLocation?: 'local' | 'r2' | null;
};

function mockAdminFiles(): AdminFileRow[] {
  return [
    {
      id: 'file-1',
      title: 'Moonlight Drive',
      artistName: 'DJ Moonlight',
      genre: 'Downtempo',
      contentType: 'TRACK',
      isPublic: true,
      durationSec: 312,
      sizeBytes: 8_400_000,
      format: 'MP3',
      createdAt: '2026-08-10T12:00:00.000Z',
      channelSlug: 'dj-moonlight',
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      revisionCount: 3,
      storageLocation: 'r2',
    },
    {
      id: 'file-2',
      title: 'Route 550 (live set)',
      artistName: 'Midnight Cartography',
      genre: 'Electronic',
      contentType: 'LIVE_SET',
      isPublic: true,
      durationSec: 3480,
      sizeBytes: 92_000_000,
      format: 'FLAC',
      createdAt: '2026-08-09T18:00:00.000Z',
      channelSlug: 'midnight-cartography',
      userId: 'u-2',
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      revisionCount: 1,
      storageLocation: 'r2',
    },
    {
      id: 'file-3',
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      genre: 'Hip-hop',
      contentType: 'TRACK',
      isPublic: false,
      durationSec: 201,
      sizeBytes: 5_100_000,
      format: 'MP3',
      createdAt: '2026-08-05T09:00:00.000Z',
      channelSlug: 'kaiku-collective',
      userId: 'u-3',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      revisionCount: 5,
      storageLocation: 'local',
    },
    {
      id: 'file-4',
      title: 'Aurora Drift (unmastered)',
      artistName: 'Northern Lights',
      genre: null,
      contentType: 'STASH',
      isPublic: false,
      durationSec: 279,
      sizeBytes: 41_000_000,
      format: 'WAV',
      createdAt: '2026-08-01T09:00:00.000Z',
      channelSlug: 'northern-lights',
      userId: 'u-4',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      audioUrl: null,
      revisionCount: 1,
      storageLocation: 'local',
    },
  ];
}

let mockAdminFilesState: AdminFileRow[] | null = null;

export async function fetchAdminFiles(query?: string): Promise<{
  data: AdminFileRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    if (!mockAdminFilesState) {
      mockAdminFilesState = mockAdminFiles();
    }
    const q = query?.trim().toLowerCase();
    const data = q
      ? mockAdminFilesState.filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.artistName.toLowerCase().includes(q) ||
            f.username.toLowerCase().includes(q),
        )
      : mockAdminFilesState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = new URLSearchParams({ limit: '100' });
    if (query?.trim()) {
      qs.set('q', query.trim());
    }
    const data = await getJson<{ items: AdminFileRow[] }>(
      `/api/admin/files?${qs.toString()}`,
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function deleteAdminFile(id: string) {
  if (isForceMock()) {
    mockAdminFilesState = (mockAdminFilesState ?? mockAdminFiles()).filter(
      (f) => f.id !== id,
    );
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/files/${encodeURIComponent(id)}`, 'DELETE');
}

export type AdminFileAudio = {
  audioUrl: string | null;
  title: string;
  artistName: string;
  channelSlug: string;
  bannerUrl: string | null;
  durationSec: number | null;
};

/** Presigned playback URL for one file — fetched lazily on play-button click
 * rather than eagerly for every row in the list (the list can be up to 100
 * rows; the per-user drill-down already returns previewUrl inline instead,
 * since that list is small). */
export async function fetchAdminFileAudio(id: string): Promise<{
  data: AdminFileAudio | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const file = (mockAdminFilesState ?? mockAdminFiles()).find(
      (f) => f.id === id,
    );
    return {
      data: file
        ? {
            audioUrl: file.audioUrl,
            title: file.title,
            artistName: file.artistName,
            channelSlug: file.channelSlug,
            bannerUrl: null,
            durationSec: file.durationSec,
          }
        : null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminFileAudio>(
      `/api/admin/files/${encodeURIComponent(id)}/audio`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
