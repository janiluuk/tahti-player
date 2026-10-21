// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { CronHistoryDialog } from './CronHistoryDialog';

describe('formatRunDuration', () => {
  it('reads milliseconds, seconds, minutes and unfinished runs', () => {
    expect(admin.formatRunDuration(null)).toBe('still running');
    expect(admin.formatRunDuration(420)).toBe('420 ms');
    expect(admin.formatRunDuration(12_300)).toBe('12.3 s');
    expect(admin.formatRunDuration(185_000)).toBe('3 min');
  });
});

describe('fetchAdminCronHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for one job by name', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
      );
    await admin.fetchAdminCronHistory('radio-rotation');
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/admin/stats/cron-runs/history?jobName=radio-rotation&limit=50',
    );
  });
});

describe('CronHistoryDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists runs with outcome, duration and error, and counts failures', async () => {
    vi.spyOn(admin, 'fetchAdminCronHistory').mockResolvedValue({
      ok: true,
      total: 120,
      runs: [
        {
          id: '2',
          jobName: 'radio-rotation',
          startedAt: '2026-09-29T08:00:00.000Z',
          finishedAt: '2026-09-29T08:00:01.200Z',
          outcome: 'ERROR',
          errorMessage: 'Timed out after 30 s',
          durationMs: 1200,
        },
        {
          id: '1',
          jobName: 'radio-rotation',
          startedAt: '2026-09-29T07:00:00.000Z',
          finishedAt: null,
          outcome: null,
          errorMessage: null,
          durationMs: null,
        },
      ],
    });
    await act(async () => {
      render(<CronHistoryDialog jobName="radio-rotation" onClose={vi.fn()} />);
    });
    expect(
      screen.getByText('The latest 2 of 120 runs, 1 failed.'),
    ).toBeTruthy();
    expect(screen.getByText('Timed out after 30 s')).toBeTruthy();
    expect(screen.getByText('still running')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
  });
});
