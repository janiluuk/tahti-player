import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportTrack, fetchTrackExportStatus } from '../api/sources';
import { TrackExportPanel } from './TrackExportPanel';

vi.mock('../api/sources', () => ({
  exportTrack: vi.fn(),
  fetchTrackExportStatus: vi.fn(),
}));
vi.mock('../plugins/export', () => ({
  EXPORT_TARGETS: [
    {
      id: 'mixcloud',
      label: 'Mixcloud',
      color: '#5000ff',
      supportsTracks: true,
    },
  ],
}));

async function renderPanel(
  status: Awaited<ReturnType<typeof fetchTrackExportStatus>>,
) {
  vi.mocked(fetchTrackExportStatus).mockResolvedValue(status);
  await act(async () => {
    render(<TrackExportPanel soundId="s1" />);
  });
}

describe('TrackExportPanel', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a failed upload's error instead of a check mark", async () => {
    await renderPanel({
      status: 'FAILED',
      url: null,
      error: 'Mixcloud rejected the file',
    });
    expect(
      screen.getByText('Upload failed: Mixcloud rejected the file'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Export added')).toBeNull();
  });

  it('links a finished upload on Mixcloud', async () => {
    await renderPanel({
      status: 'DONE',
      url: 'https://www.mixcloud.com/selector/night/',
      error: null,
    });
    expect(
      screen
        .getByRole('link', { name: 'Open on Mixcloud' })
        .getAttribute('href'),
    ).toBe('https://www.mixcloud.com/selector/night/');
  });

  it('offers to connect Mixcloud when the API asks for it', async () => {
    vi.mocked(exportTrack).mockResolvedValue({
      ok: false,
      error: 'Connect your Mixcloud account first',
      connectUrl: '/tahti-api/api/me/mixcloud/oauth/start',
    });
    await renderPanel(null);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    });
    expect(
      screen.getByText('Connect your Mixcloud account first'),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Connect Mixcloud' })
        .getAttribute('href'),
    ).toBe('/tahti-api/api/me/mixcloud/oauth/start');
  });

  it('shows a queued upload after exporting', async () => {
    vi.mocked(exportTrack).mockResolvedValue({
      ok: true,
      status: { status: 'PENDING', url: null, error: null },
    });
    await renderPanel(null);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export/ }));
    });
    expect(screen.getByText('Queued for upload.')).toBeTruthy();
  });
});
