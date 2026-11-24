// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminQueueJob } from '../../../api/admin/admin-queue-jobs';
import { applyLocale } from '../../../lib/locale';
import { QueuesJobsPanel } from './QueuesJobsPanel';

const api = vi.hoisted(() => ({
  fetchAdminQueueJobs: vi.fn(),
  fetchAdminQueuePaused: vi.fn(),
  fetchAdminStuckPending: vi.fn(),
  pauseAdminMediaQueue: vi.fn(),
  resumeAdminMediaQueue: vi.fn(),
  retryAdminQueueJob: vi.fn(),
  removeAdminQueueJob: vi.fn(),
  requeueAdminStuckPending: vi.fn(),
}));

vi.mock('../../../api/admin/admin-queue-jobs', () => api);

const JOB: AdminQueueJob = {
  id: 'job-1',
  name: 'transcode-sound',
  state: 'waiting',
  timestamp: new Date().toISOString(),
  processedOn: null,
  finishedOn: null,
  attemptsMade: 0,
  failedReason: null,
  subject: {
    kind: 'sound',
    id: 'sound-1',
    title: 'First upload',
    ownerUsername: 'artist',
  },
};

function jobsResult(jobs: AdminQueueJob[]) {
  return {
    data: { state: 'waiting', total: jobs.length, page: 0, limit: 50, jobs },
    meta: { source: 'api' },
  };
}

describe('QueuesJobsPanel', () => {
  beforeEach(() => {
    applyLocale('en_US');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    api.fetchAdminQueuePaused.mockResolvedValue({
      data: { paused: false },
      meta: { source: 'api' },
    });
    api.fetchAdminStuckPending.mockResolvedValue({
      data: { total: 0, sounds: [] },
      meta: { source: 'api' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('refreshes the job list on its own while live updates are on', async () => {
    api.fetchAdminQueueJobs
      .mockResolvedValueOnce(jobsResult([JOB]))
      .mockResolvedValue(
        jobsResult([
          JOB,
          {
            ...JOB,
            id: 'job-2',
            subject: { ...JOB.subject, title: 'Second upload' },
          },
        ]),
      );
    render(<QueuesJobsPanel />);
    expect(await screen.findByText('First upload')).toBeTruthy();
    expect(screen.queryByText('Second upload')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(await screen.findByText('Second upload')).toBeTruthy();
    expect(screen.getByTestId('admin-queues-updated').textContent).toMatch(
      /Updated/,
    );
  });

  it('stops polling when live updates are switched off', async () => {
    api.fetchAdminQueueJobs.mockResolvedValue(jobsResult([JOB]));
    render(<QueuesJobsPanel />);
    await screen.findByText('First upload');
    const calls = api.fetchAdminQueueJobs.mock.calls.length;

    fireEvent.click(screen.getByRole('switch', { name: 'Live updates' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(api.fetchAdminQueueJobs.mock.calls.length).toBe(calls);
  });

  it('shows how long an active job has been running', async () => {
    api.fetchAdminQueueJobs.mockResolvedValue(
      jobsResult([
        {
          ...JOB,
          state: 'active',
          processedOn: new Date(Date.now() - 7 * 60_000).toISOString(),
        },
      ]),
    );
    render(<QueuesJobsPanel />);
    expect(await screen.findByText(/running 7m/)).toBeTruthy();
  });
});
