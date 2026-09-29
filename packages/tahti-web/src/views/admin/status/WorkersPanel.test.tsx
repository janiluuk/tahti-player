// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { WorkersPanel } from './WorkersPanel';

const WORKER: admin.AdminWorker = {
  name: 'media-1',
  lanes: ['transcode'],
  status: 'offline',
  jobStatus: null,
  hostname: 'tahti-worker-1',
  pid: 4211,
  startedAt: null,
  updatedAt: '2026-09-29T08:00:00.000Z',
  lastJobName: 'transcode',
  lastJobId: '1',
  lastJobStatus: 'failed',
  lastJobAt: '2026-09-29T08:00:00.000Z',
};

describe('WorkersPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists workers, flags offline ones and opens a job history', async () => {
    vi.spyOn(admin, 'fetchAdminWorkers').mockResolvedValue({
      ok: true,
      workers: [WORKER, { ...WORKER, name: 'mail-1', status: 'online' }],
    });
    const history = vi
      .spyOn(admin, 'fetchAdminWorkerHistory')
      .mockResolvedValue({
        ok: true,
        history: [
          {
            jobId: '1',
            jobName: 'transcode',
            status: 'failed',
            at: '2026-09-29T08:00:00.000Z',
            errorMessage: 'ffmpeg exited with code 1',
          },
        ],
      });

    await act(async () => {
      render(<WorkersPanel />);
    });
    expect(
      screen.getByText('1 of 2 offline (no heartbeat recently).'),
    ).toBeTruthy();
    expect(screen.getByText('Offline')).toBeTruthy();
    expect(screen.getAllByText(/tahti-worker-1 · pid 4211/)).toHaveLength(2);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'History' })[0]!);
    });
    expect(history).toHaveBeenCalledWith('media-1');
    expect(screen.getByText('ffmpeg exited with code 1')).toBeTruthy();
  });

  it('shows a load error with retry', async () => {
    vi.spyOn(admin, 'fetchAdminWorkers').mockResolvedValue({
      ok: false,
      error: '503',
    });
    await act(async () => {
      render(<WorkersPanel />);
    });
    expect(screen.getByText("Couldn't load workers")).toBeTruthy();
  });
});
