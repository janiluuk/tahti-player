import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadStudioReleaseTrack } from '../../../api/studio/release-track-download';
import { ReleaseTrackRow } from './ReleaseTrackRow';

vi.mock('../../../api/studio/release-track-download', () => ({
  downloadStudioReleaseTrack: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const track = { id: 't1', position: 1, title: 'Intro', status: 'READY' };

describe('ReleaseTrackRow download', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads a ready track of your release', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    vi.mocked(downloadStudioReleaseTrack).mockResolvedValue({
      ok: true,
      url: 'https://minio.test/intro.opus',
    });
    render(<ReleaseTrackRow track={track} releaseId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Download Intro' }));
    });
    expect(downloadStudioReleaseTrack).toHaveBeenCalledWith('r1', 't1');
    expect(assign).toHaveBeenCalledWith('https://minio.test/intro.opus');
  });

  it("toasts the API's error", async () => {
    vi.mocked(downloadStudioReleaseTrack).mockResolvedValue({
      ok: false,
      error: 'Download not available',
    });
    render(<ReleaseTrackRow track={track} releaseId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Download Intro' }));
    });
    expect(toast.error).toHaveBeenCalledWith('Download not available');
  });

  it('hides the download while the track is processing', () => {
    render(
      <ReleaseTrackRow
        track={{ ...track, status: 'PROCESSING' }}
        releaseId="r1"
      />,
    );
    expect(screen.queryByRole('button', { name: 'Download Intro' })).toBeNull();
  });
});
