import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadReleaseTrack } from '../api/release-download';
import { ReleaseTrackDownloads } from './ReleaseTrackDownloads';

vi.mock('../api/release-download', () => ({ downloadReleaseTrack: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const TRACKS = [
  { id: 't1', title: 'Intro', position: 1, audioUrl: 'https://x/1.opus' },
  {
    id: 't2',
    title: 'Backers only',
    position: 2,
    audioUrl: null,
    gate: 'SUBSCRIBERS_ONLY',
  },
  { title: 'No id', position: 3, audioUrl: 'https://x/3.opus' },
];

describe('ReleaseTrackDownloads', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('offers only tracks this listener can play', () => {
    render(<ReleaseTrackDownloads smartLinkSlug="nights" tracks={TRACKS} />);
    expect(screen.getByRole('button', { name: 'Download Intro' })).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Download Backers only' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download No id' })).toBeNull();
  });

  it('opens the presigned URL', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    vi.mocked(downloadReleaseTrack).mockResolvedValue({
      ok: true,
      url: 'https://minio.test/intro.opus',
    });
    render(<ReleaseTrackDownloads smartLinkSlug="nights" tracks={TRACKS} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Download Intro' }));
    });
    expect(downloadReleaseTrack).toHaveBeenCalledWith('nights', 't1');
    expect(assign).toHaveBeenCalledWith('https://minio.test/intro.opus');
  });

  it("toasts the API's refusal", async () => {
    vi.mocked(downloadReleaseTrack).mockResolvedValue({
      ok: false,
      error: 'Download rate limit exceeded. Try again later.',
    });
    render(<ReleaseTrackDownloads smartLinkSlug="nights" tracks={TRACKS} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Download Intro' }));
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Download rate limit exceeded. Try again later.',
    );
  });

  it('renders nothing when no track can be downloaded', () => {
    const { container } = render(
      <ReleaseTrackDownloads smartLinkSlug="nights" tracks={[TRACKS[1]!]} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
