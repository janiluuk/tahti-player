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

import type { StudioReleaseTrack } from '../../../api/studio-types';
import * as api from '../../../api/studio/release-track-upload';
import { ReleaseTrackAudioUpload } from './ReleaseTrackAudioUpload';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const track = (overrides: Partial<StudioReleaseTrack> = {}) => ({
  id: 't1',
  position: 1,
  title: 'Night Drive',
  status: 'PENDING',
  ...overrides,
});

const openPicker = () =>
  fireEvent.click(screen.getByRole('button', { name: /Upload audio/ }));

const chooseFile = () => {
  fireEvent.change(screen.getByLabelText('Audio for Night Drive'), {
    target: { files: [new File(['a'], 'night.wav', { type: 'audio/wav' })] },
  });
};

describe('ReleaseTrackAudioUpload', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('uploads with progress and hands back the processing state', async () => {
    let finish: (value: api.ReleaseTrackUploadResult) => void = () => {};
    const upload = vi
      .spyOn(api, 'uploadReleaseTrackAudio')
      .mockImplementation((_r, _t, _f, options) => {
        options?.onProgress?.(0.4);
        return new Promise((resolve) => {
          finish = resolve;
        });
      });
    const onUploaded = vi.fn();
    render(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track()}
        onUploaded={onUploaded}
      />,
    );

    openPicker();
    chooseFile();

    expect(upload.mock.calls[0]!.slice(0, 2)).toEqual(['r1', 't1']);
    expect(
      screen.getByRole('meter', { name: 'Uploading Night Drive, 40%' }),
    ).toBeTruthy();
    await act(async () => {
      finish({ ok: true, sourceKey: 'k', status: 'SCANNING' });
    });
    expect(onUploaded).toHaveBeenCalledWith('t1', {
      sourceKey: 'k',
      status: 'SCANNING',
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it('cancels an upload in flight', async () => {
    let signal: AbortSignal | undefined;
    vi.spyOn(api, 'uploadReleaseTrackAudio').mockImplementation(
      (_r, _t, _f, options) =>
        new Promise((resolve) => {
          signal = options?.signal;
          signal?.addEventListener('abort', () =>
            resolve({ ok: false, cancelled: true, error: 'Upload cancelled' }),
          );
        }),
    );
    const onUploaded = vi.fn();
    render(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track()}
        onUploaded={onUploaded}
      />,
    );

    openPicker();
    chooseFile();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(signal?.aborted).toBe(true);
    expect(onUploaded).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Upload cancelled.');
    expect(screen.getByRole('button', { name: /Upload audio/ })).toBeTruthy();
  });

  it('shows the API error', async () => {
    vi.spyOn(api, 'uploadReleaseTrackAudio').mockResolvedValue({
      ok: false,
      cancelled: false,
      error: 'Release not found',
    });
    render(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track()}
        onUploaded={vi.fn()}
      />,
    );
    openPicker();
    await act(async () => {
      chooseFile();
    });
    expect(toast.error).toHaveBeenCalledWith('Release not found');
  });

  it('shows processing and failed states, and hides for ready or library tracks', () => {
    const { rerender, container } = render(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track({ status: 'TRANSCODING' })}
        onUploaded={vi.fn()}
      />,
    );
    expect(screen.getByText('Processing')).toBeTruthy();

    rerender(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track({ status: 'FAILED' })}
        onUploaded={vi.fn()}
      />,
    );
    expect(screen.getByText('Processing failed')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload again/ })).toBeTruthy();

    rerender(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track({ status: 'READY', sourceKey: 'k' })}
        onUploaded={vi.fn()}
      />,
    );
    expect(container.textContent).toBe('');

    rerender(
      <ReleaseTrackAudioUpload
        releaseId="r1"
        track={track({ soundId: 's1' })}
        onUploaded={vi.fn()}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
