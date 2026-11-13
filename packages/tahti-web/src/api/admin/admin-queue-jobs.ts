import type { FetchMeta } from '../client';
import { getJson } from '../http';
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
            attemptsMade: 0,
            failedReason: null,
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
