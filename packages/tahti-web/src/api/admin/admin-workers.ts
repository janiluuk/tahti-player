import { getJson } from '../http';
import { isForceMock } from '../mode';

export type AdminWorker = {
  name: string;
  lanes: string[];
  status: 'online' | 'offline';
  jobStatus: string | null;
  hostname: string | null;
  pid: number | null;
  startedAt: string | null;
  updatedAt: string | null;
  lastJobName: string | null;
  lastJobId: string | null;
  lastJobStatus: string | null;
  lastJobAt: string | null;
};

export type AdminWorkerJobEvent = {
  jobId: string;
  jobName: string;
  status: 'active' | 'completed' | 'failed';
  at: string;
  errorMessage?: string;
};

function mockWorkers(): AdminWorker[] {
  const now = Date.now();
  return [
    {
      name: 'media-1',
      lanes: ['transcode', 'waveform'],
      status: 'online',
      jobStatus: 'idle',
      hostname: 'tahti-worker-1',
      pid: 4211,
      startedAt: new Date(now - 36 * 3600_000).toISOString(),
      updatedAt: new Date(now - 5_000).toISOString(),
      lastJobName: 'transcode',
      lastJobId: '9812',
      lastJobStatus: 'completed',
      lastJobAt: new Date(now - 90_000).toISOString(),
    },
    {
      name: 'mail-1',
      lanes: ['mail'],
      status: 'offline',
      jobStatus: null,
      hostname: 'tahti-worker-2',
      pid: null,
      startedAt: null,
      updatedAt: new Date(now - 3 * 3600_000).toISOString(),
      lastJobName: 'send-newsletter',
      lastJobId: '441',
      lastJobStatus: 'failed',
      lastJobAt: new Date(now - 3 * 3600_000).toISOString(),
    },
  ];
}

export async function fetchAdminWorkers(): Promise<
  { ok: true; workers: AdminWorker[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, workers: mockWorkers() };
  }
  try {
    const data = await getJson<{ workers: AdminWorker[] }>(
      '/api/admin/workers',
    );
    return { ok: true, workers: data.workers };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load workers',
    };
  }
}

export async function fetchAdminWorkerHistory(
  name: string,
): Promise<
  { ok: true; history: AdminWorkerJobEvent[] } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      history: [
        {
          jobId: '9812',
          jobName: 'transcode',
          status: 'completed',
          at: new Date(Date.now() - 90_000).toISOString(),
        },
        {
          jobId: '9811',
          jobName: 'waveform',
          status: 'failed',
          at: new Date(Date.now() - 600_000).toISOString(),
          errorMessage: 'ffmpeg exited with code 1',
        },
      ],
    };
  }
  try {
    const data = await getJson<{ history: AdminWorkerJobEvent[] }>(
      `/api/admin/workers/${encodeURIComponent(name)}`,
    );
    return { ok: true, history: data.history };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not load the history',
    };
  }
}
