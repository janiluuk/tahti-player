// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as obsPreset from '../api/obs-preset';
import { ObsPresetButton } from './ObsPresetButton';

const PRESET: obsPreset.ObsPreset = {
  server: 'rtmp://ingest/live',
  streamKey: 'slug__key',
  recommended: {
    audioCodec: 'AAC',
    audioBitrateKbps: 128,
    sampleRateHz: 44100,
    channels: 'Stereo',
    videoCodec: 'x264',
    videoBitrateKbps: 2500,
    keyframeIntervalSec: 2,
    preset: 'veryfast',
    profile: 'main',
    tune: 'zerolatency',
  },
  sceneCollection: {
    name: 'Tahti — slug',
    sources: [{ id: 'image_source', name: 'Cover Art' }],
  },
  sceneCollectionFilename: 'tahti-slug-scene.json',
};

describe('ObsPresetButton', () => {
  let downloads: { filename: string; blob: Blob }[];

  beforeEach(() => {
    downloads = [];
    let lastBlob: Blob | null = null;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      lastBlob = blob;
      return 'blob:preset';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push({ filename: this.download, blob: lastBlob! });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the recommended settings and downloads the server scene collection', async () => {
    vi.spyOn(obsPreset, 'fetchObsPreset').mockResolvedValue({
      ok: true,
      data: PRESET,
    });
    render(<ObsPresetButton />);

    const settings = await screen.findByLabelText('Recommended OBS settings');
    expect(settings.textContent).toContain('AAC · 128 kbps · 44.1 kHz');
    expect(settings.textContent).toContain('x264 · 2500 kbps');
    expect(settings.textContent).toContain('2 s');
    expect(settings.textContent).toContain('veryfast / main / zerolatency');

    fireEvent.click(
      screen.getByRole('button', { name: /Download OBS preset/ }),
    );

    expect(downloads).toHaveLength(1);
    expect(downloads[0].filename).toBe('tahti-slug-scene.json');
    expect(JSON.parse(await downloads[0].blob.text())).toEqual(
      PRESET.sceneCollection,
    );
  });

  it('retries on click and toasts the error when the preset cannot be loaded', async () => {
    const fetchPreset = vi
      .spyOn(obsPreset, 'fetchObsPreset')
      .mockResolvedValue({ ok: false, error: 'Channel not found' });
    const toastError = vi.spyOn(toast, 'error').mockImplementation(() => 1);
    render(<ObsPresetButton />);
    await waitFor(() => expect(fetchPreset).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Download OBS preset/ }),
      );
    });

    expect(fetchPreset).toHaveBeenCalledTimes(2);
    expect(toastError).toHaveBeenCalledWith('Channel not found');
    expect(downloads).toHaveLength(0);
    expect(screen.queryByLabelText('Recommended OBS settings')).toBeNull();
  });
});
