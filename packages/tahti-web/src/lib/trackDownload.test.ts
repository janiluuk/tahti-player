import { afterEach, describe, expect, it, vi } from 'vitest';

import * as download from '../api/public-sound-download';
import * as gates from '../api/sound-download-gates';
import { downloadTrackFromRow } from './trackDownload';

describe('downloadTrackFromRow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('answers gated without downloading when the artist asks for a follow', async () => {
    vi.spyOn(gates, 'fetchDownloadGates').mockResolvedValue({
      canDownload: false,
    } as never);
    const fetchDownload = vi.spyOn(download, 'fetchPublicSoundDownload');
    await expect(downloadTrackFromRow('demo', 's1', 'Set')).resolves.toEqual({
      kind: 'gated',
    });
    expect(fetchDownload).not.toHaveBeenCalled();
  });

  it('starts the download when nothing blocks it', async () => {
    vi.spyOn(gates, 'fetchDownloadGates').mockResolvedValue(null as never);
    vi.spyOn(download, 'fetchPublicSoundDownload').mockResolvedValue({
      ok: true,
      url: 'https://example.com/s1.wav',
      filename: 'set.wav',
    } as never);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    await expect(downloadTrackFromRow('demo', 's1', 'Set')).resolves.toEqual({
      kind: 'started',
    });
    expect(click).toHaveBeenCalled();
  });

  it("passes on the API's reason", async () => {
    vi.spyOn(gates, 'fetchDownloadGates').mockResolvedValue(null as never);
    vi.spyOn(download, 'fetchPublicSoundDownload').mockResolvedValue({
      ok: false,
      error: 'Downloads are turned off',
    } as never);
    await expect(downloadTrackFromRow('demo', 's1', 'Set')).resolves.toEqual({
      kind: 'failed',
      error: 'Downloads are turned off',
    });
  });
});
