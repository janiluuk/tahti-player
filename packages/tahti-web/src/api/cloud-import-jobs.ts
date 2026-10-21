import type { FetchMeta } from './client';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type CloudImportStatus = 'QUEUED' | 'DOWNLOADING' | 'DONE' | 'FAILED';

/** One row of `GET /api/me/cloud-import/jobs` (Google Drive and SoundCloud
 * imports are queued and fetched by a worker). */
export type CloudImportJob = {
  id: string;
  source: string;
  fileName: string;
  status: CloudImportStatus;
  error: string | null;
  soundId: string | null;
  bytesTransferred: number | null;
  queuedAt: string;
  completedAt: string | null;
};

export function isImportRunning(job: CloudImportJob): boolean {
  return job.status === 'QUEUED' || job.status === 'DOWNLOADING';
}

/** The caller's 20 most recent import jobs, newest first. */
export async function fetchCloudImportJobs(): Promise<{
  data: CloudImportJob[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ jobs?: CloudImportJob[] }>(
      '/api/me/cloud-import/jobs',
    );
    return {
      data: Array.isArray(data.jobs) ? data.jobs : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: [],
      meta: {
        source: 'api',
        reason: err instanceof Error ? err.message : 'fetch failed',
      },
    };
  }
}
