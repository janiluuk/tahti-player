// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../../test/renderWithRouter';
import { cronIntervalLabel, CronJobsTable } from './CronJobsTable';
import { LiveNowStrip } from './LiveNowStrip';

describe('cronIntervalLabel', () => {
  it('reads interval jobs and leaves cron expressions alone', () => {
    expect(cronIntervalLabel('every 60000ms')).toBe('1 min');
    expect(cronIntervalLabel('every 7200000ms')).toBe('2 h');
    expect(cronIntervalLabel('every 15000ms')).toBe('15 s');
    expect(cronIntervalLabel('0 3 * * *')).toBeNull();
  });
});

describe('CronJobsTable', () => {
  afterEach(cleanup);

  it('opens run history from the row and from the job name once each', async () => {
    const onOpen = vi.fn();
    await renderWithRouter(
      <CronJobsTable
        onOpen={onOpen}
        jobs={[
          {
            jobName: 'sweep',
            description: 'Sweeps',
            pattern: 'every 60000ms',
            lastRun: null,
          },
        ]}
      />,
    );
    const row = screen.getByTestId('cron-job-row');
    expect(row.textContent).toContain('Not run yet');
    expect(row.textContent).toContain('Every 1 min');
    await act(async () => {
      fireEvent.click(row);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sweep/ }));
    });
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenLastCalledWith('sweep');
  });
});

describe('LiveNowStrip', () => {
  afterEach(cleanup);

  it('renders nothing when nobody is live', async () => {
    const { container } = await renderWithRouter(<LiveNowStrip streams={[]} />);
    expect(container.textContent).toBe('');
  });

  it('shows the first eight channels and expands to all', async () => {
    const streams = Array.from({ length: 11 }, (_, index) => ({
      slug: `dj-${index}`,
      artistName: `DJ ${index}`,
      elapsedSec: 60 * index,
    }));
    await renderWithRouter(<LiveNowStrip streams={streams} />, {
      paths: ['/admin/streams'],
    });
    const list = screen.getByRole('list', { name: 'Live now (11)' });
    expect(list.querySelectorAll('li')).toHaveLength(8);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Show all (11)' }));
    });
    expect(list.querySelectorAll('li')).toHaveLength(11);
    expect(
      screen.getByRole('link', { name: 'Manage streams' }),
    ).toHaveAttribute('href', '/admin/streams');
  });
});
