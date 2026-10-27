import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as jobsApi from '../api/cloud-import-jobs';
import { renderWithRouter } from '../test/renderWithRouter';
import { ImportJobsPanel } from './ImportJobsPanel';

const job = (
  over: Partial<jobsApi.CloudImportJob>,
): jobsApi.CloudImportJob => ({
  id: 'j1',
  source: 'SOUNDCLOUD',
  fileName: 'Night Drive.mp3',
  status: 'QUEUED',
  error: null,
  soundId: null,
  bytesTransferred: null,
  queuedAt: '2026-10-19T10:00:00.000Z',
  completedAt: null,
  ...over,
});

describe('ImportJobsPanel', () => {
  it('shows each import with its state', async () => {
    vi.spyOn(jobsApi, 'fetchCloudImportJobs').mockResolvedValue({
      data: [
        job({ id: 'a', fileName: 'Queued one', status: 'QUEUED' }),
        job({
          id: 'b',
          fileName: 'Done one',
          status: 'DONE',
          soundId: 's9',
          source: 'GOOGLE_DRIVE',
        }),
        job({
          id: 'c',
          fileName: 'Bad one',
          status: 'FAILED',
          error: 'Not audio',
        }),
      ],
      meta: { source: 'api' },
    });

    await renderWithRouter(<ImportJobsPanel />);

    expect(await screen.findByText('Queued one')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Queued');
    expect(
      screen.getByRole('link', { name: 'Imported — open track' }),
    ).toHaveAttribute('href', '/studio/sounds/s9');
    expect(screen.getByText('Google Drive')).toBeVisible();
    expect(screen.getByText('Failed: Not audio')).toBeVisible();
    expect(
      screen.getByText('If an import fails, we notify you.'),
    ).toBeVisible();
  });

  it('is hidden when there are no imports', async () => {
    vi.spyOn(jobsApi, 'fetchCloudImportJobs').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });

    await renderWithRouter(<ImportJobsPanel />);

    expect(screen.queryByTestId('import-jobs')).toBeNull();
  });
});
