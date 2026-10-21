// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import * as upload from '../../../api/studio/release-track-upload';
import { NewReleaseTrackUploadDialog } from './NewReleaseTrackUploadDialog';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const renderDialog = () => {
  const props = {
    releaseId: 'r1',
    isOpen: true,
    onClose: vi.fn(),
    onTrackCreated: vi.fn(),
    onUploaded: vi.fn(),
  };
  render(<NewReleaseTrackUploadDialog {...props} />);
  fireEvent.change(screen.getByLabelText('Audio file'), {
    target: {
      files: [new File(['a'], 'Polar Nights.flac', { type: 'audio/flac' })],
    },
  });
  return props;
};

describe('NewReleaseTrackUploadDialog', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('creates the track from the file name, then uploads its audio', async () => {
    const add = vi.spyOn(studio, 'addStudioReleaseTrack').mockResolvedValue({
      ok: true,
      data: { id: 't9', position: 3, title: 'Polar Nights', status: 'PENDING' },
    });
    const send = vi
      .spyOn(upload, 'uploadReleaseTrackAudio')
      .mockResolvedValue({ ok: true, sourceKey: 'k', status: 'SCANNING' });
    const props = renderDialog();

    expect(
      (screen.getByLabelText('Track title') as HTMLInputElement).value,
    ).toBe('Polar Nights');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Upload track' }));
    });

    expect(add).toHaveBeenCalledWith('r1', { title: 'Polar Nights' });
    expect(props.onTrackCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't9' }),
    );
    expect(send.mock.calls[0]!.slice(0, 2)).toEqual(['r1', 't9']);
    expect(props.onUploaded).toHaveBeenCalledWith('t9', {
      sourceKey: 'k',
      status: 'SCANNING',
    });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('does not upload when the track cannot be created', async () => {
    vi.spyOn(studio, 'addStudioReleaseTrack').mockResolvedValue({
      ok: false,
      error: 'Release not found',
    });
    const send = vi.spyOn(upload, 'uploadReleaseTrackAudio');
    const props = renderDialog();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Upload track' }));
    });

    expect(toast.error).toHaveBeenCalledWith('Release not found');
    expect(send).not.toHaveBeenCalled();
    expect(props.onTrackCreated).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
