import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type AdminQueueJobState =
  'waiting' | 'active' | 'delayed' | 'failed' | 'completed';

export type AdminQueueJob = {
  id: string;
  name: string;
  state: AdminQueueJobState;
  timestamp: string | null;
  processedOn: string | null;
  finishedOn: string | null;
  attemptsMade: number;
  failedReason: string | null;
  subject: {
    kind: 'sound' | 'unknown';
    id: string | null;
    title: string | null;
    ownerUsername: string | null;
  };
};

export type AdminQueueJobList = {
  state: AdminQueueJobState;
  total: number;
  page: number;
  limit: number;
  jobs: AdminQueueJob[];
};

export type AdminStuckPendingSound = {
  id: string;
  title: string;
  status: 'PENDING' | 'PROCESSING';
  updatedAt: string;
  ownerUsername: string | null;
  rawKey: string | null;
};

export type AdminStuckPendingList = {
  total: number;
  sounds: AdminStuckPendingSound[];
};

export async function fetchAdminQueueJobs(input: {
  state?: AdminQueueJobState;
  page?: number;
  limit?: number;
  jobName?: string;
}): Promise<{ data: AdminQueueJobList | null; meta: FetchMeta }> {
  const state = input.state ?? 'waiting';
  if (isForceMock()) {
    return {
      data: {
        state,
        total: 1,
        page: 0,
        limit: input.limit ?? 50,
        jobs: [
          {
            id: 'mock-job-1',
            name: 'transcode-sound',
            state,
            timestamp: new Date().toISOString(),
            processedOn: null,
            finishedOn: null,
            attemptsMade: state === 'failed' ? 2 : 0,
            failedReason:
              state === 'failed' ? 'ffmpeg exited with code 1' : null,
            subject: {
              kind: 'sound',
              id: 'mock-sound-1',
              title: 'Northern Lights — Live Set',
              ownerUsername: 'northern-lights',
            },
          },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const params = new URLSearchParams();
    params.set('state', state);
    if (input.page != null) {
      params.set('page', String(input.page));
    }
    if (input.limit != null) {
      params.set('limit', String(input.limit));
    }
    if (input.jobName) {
      params.set('jobName', input.jobName);
    }
    const data = await getJson<AdminQueueJobList>(
      `/api/admin/queues/media/jobs?${params.toString()}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminQueuePaused(): Promise<{
  data: { paused: boolean } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { paused: false },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ paused: boolean }>(
      '/api/admin/queues/media/paused',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function pauseAdminMediaQueue(): Promise<
  { ok: true; paused: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, paused: true };
  }
  try {
    const data = await sendJson<{ paused: boolean }>(
      '/api/admin/queues/media/pause',
      'POST',
    );
    return { ok: true, paused: data.paused };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed',
    };
  }
}

export async function resumeAdminMediaQueue(): Promise<
  { ok: true; paused: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, paused: false };
  }
  try {
    const data = await sendJson<{ paused: boolean }>(
      '/api/admin/queues/media/resume',
      'POST',
    );
    return { ok: true, paused: data.paused };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed',
    };
  }
}

export async function retryAdminQueueJob(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  return mutate(
    `/api/admin/queues/media/jobs/${encodeURIComponent(id)}/retry`,
    'POST',
  );
}

export async function removeAdminQueueJob(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  return mutate(
    `/api/admin/queues/media/jobs/${encodeURIComponent(id)}`,
    'DELETE',
  );
}

export async function fetchAdminStuckPending(): Promise<{
  data: AdminStuckPendingList | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        total: 1,
        sounds: [
          {
            id: 'mock-stuck-1',
            title: 'Stuck upload',
            status: 'PENDING',
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            ownerUsername: 'yaniho',
            rawKey: 'uploads/mock.flac',
          },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStuckPendingList>(
      '/api/admin/queues/media/stuck-pending',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function requeueAdminStuckPending(input: {
  soundId?: string;
  all?: boolean;
}): Promise<
  { ok: true; enqueued: number; ids: string[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      enqueued: input.all ? 1 : 1,
      ids: [input.soundId ?? 'mock-stuck-1'],
    };
  }
  try {
    const data = await sendJson<{ enqueued: number; ids: string[] }>(
      '/api/admin/queues/media/stuck-pending/requeue',
      'POST',
      input,
    );
    return { ok: true, enqueued: data.enqueued, ids: data.ids };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed',
    };
  }
}
