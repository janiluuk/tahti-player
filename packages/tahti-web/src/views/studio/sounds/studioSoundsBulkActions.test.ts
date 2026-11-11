import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backfillStudioSoundCovers } from '../../../api/studio';
import { createStudioSoundsBulkActions } from './studioSoundsBulkActions';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), message: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../api/studio', () => ({
  backfillStudioSoundCovers: vi.fn(),
  bulkDeleteStudioSounds: vi.fn(),
  bulkPatchStudioSounds: vi.fn(),
  deleteStudioSound: vi.fn(),
  fetchStudioSoundIds: vi.fn(),
  fetchStudioSoundsPage: vi.fn(),
  STUDIO_SOUND_BULK_MAX_IDS: 500,
}));

function actions() {
  const deps = {
    bulkBusy: false,
    coversBusy: false,
    setCoversBusy: vi.fn(),
    serverFilter: {},
    selectedIds: new Set<string>(),
    reload: vi.fn(),
  };
  return {
    deps,
    ...createStudioSoundsBulkActions(
      deps as unknown as Parameters<typeof createStudioSoundsBulkActions>[0],
    ),
  };
}

describe('backfillCovers', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
  });

  it('says how many covers came from the provider and from presets', async () => {
    vi.mocked(backfillStudioSoundCovers).mockResolvedValue({
      ok: true,
      data: { assigned: 3, totalMatched: 3, fromProvider: 2, fromPresets: 1 },
    });
    const { backfillCovers, deps } = actions();
    backfillCovers();
    await vi.waitFor(() => expect(deps.reload).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Assigned covers to 3 sounds', {
      description: '2 from the provider, 1 from artwork presets',
    });
  });

  it('keeps the plain toast when the API has no source counts', async () => {
    vi.mocked(backfillStudioSoundCovers).mockResolvedValue({
      ok: true,
      data: { assigned: 1, totalMatched: 1 },
    });
    const { backfillCovers, deps } = actions();
    backfillCovers();
    await vi.waitFor(() => expect(deps.reload).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      'Assigned a cover to 1 sound',
      undefined,
    );
  });
});
