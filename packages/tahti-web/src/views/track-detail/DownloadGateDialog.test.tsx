import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { followArtist } from '../../api/follows';
import {
  acknowledgeRepost,
  fetchDownloadGates,
  type DownloadGateStatus,
} from '../../api/sound-download-gates';
import { DownloadGateDialog } from './DownloadGateDialog';

vi.mock('../../api/follows', () => ({ followArtist: vi.fn() }));
vi.mock('../../api/sound-download-gates', () => ({
  acknowledgeRepost: vi.fn(),
  fetchDownloadGates: vi.fn(),
}));

const blocked: DownloadGateStatus = {
  repostRequired: true,
  followRequired: true,
  repostSatisfied: false,
  followSatisfied: false,
  canDownload: false,
};

function renderDialog(onDownload = vi.fn(), signedIn = true) {
  render(
    <DownloadGateDialog
      gates={blocked}
      channelSlug="night-drive"
      soundId="s1"
      artist={{ username: 'nightdrive', displayName: 'Night Drive' }}
      signedIn={signedIn}
      onClose={vi.fn()}
      onDownload={onDownload}
    />,
  );
  return onDownload;
}

describe('DownloadGateDialog', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unlocks the download once the listener follows and shares', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.mocked(followArtist).mockResolvedValue({ ok: true, followerCount: 3 });
    vi.mocked(acknowledgeRepost).mockResolvedValue({ ok: true });
    vi.mocked(fetchDownloadGates)
      .mockResolvedValueOnce({ ...blocked, followSatisfied: true })
      .mockResolvedValueOnce({
        ...blocked,
        followSatisfied: true,
        repostSatisfied: true,
        canDownload: true,
      });
    const onDownload = renderDialog();

    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
    });
    expect(followArtist).toHaveBeenCalledWith('nightdrive');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    });
    expect(acknowledgeRepost).toHaveBeenCalledWith('night-drive', 's1');

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalled();
  });

  it('asks signed-out listeners to sign in before following', () => {
    renderDialog(vi.fn(), false);
    expect(screen.getByText('Sign in to follow')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Follow' })).toBeNull();
  });
});
