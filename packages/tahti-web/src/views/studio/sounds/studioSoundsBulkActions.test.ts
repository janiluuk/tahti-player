import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import { createStudioSoundsBulkActions } from './studioSoundsBulkActions';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), message: vi.fn(), error: vi.fn() },
}));

function actions(reload = vi.fn()) {
  return createStudioSoundsBulkActions({
    bulkBusy: false,
    setBulkBusy: vi.fn(),
    coversBusy: false,
    setCoversBusy: vi.fn(),
    serverFilter: {},
    total: 0,
    items: [],
    selectedIds: new Set(),
    allMatchingSelected: false,
    setSelectedIds: vi.fn(),
    setAllMatchingSelected: vi.fn(),
    setSelectingAll: vi.fn(),
    setSelectionNotice: vi.fn(),
    setPendingBulkDelete: vi.fn(),
    setBulkConfirmMismatch: vi.fn(),
    setBulkEditOpen: vi.fn(),
    bulkConfirmMismatch: null,
    pendingDeleteItem: null,
    setPendingDeleteItem: vi.fn(),
    requestSeq: { current: 0 },
    listSort: 'newest',
    clearSelection: vi.fn(),
    reload,
  });
}

describe('backfillCovers', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
  });

  it('says how many covers came from the provider and from presets', async () => {
    vi.spyOn(studio, 'backfillStudioSoundCovers').mockResolvedValue({
      ok: true,
      data: { assigned: 3, fromProvider: 2, fromPresets: 1, totalMatched: 3 },
    });
    const reload = vi.fn();
    actions(reload).backfillCovers();

    await vi.waitFor(() => expect(reload).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Assigned covers to 3 sounds', {
      description: 'From the provider: 2 · From presets: 1',
    });
  });

  it('keeps the plain toast when the API sends no split', async () => {
    vi.spyOn(studio, 'backfillStudioSoundCovers').mockResolvedValue({
      ok: true,
      data: { assigned: 1, totalMatched: 1 },
    });
    const reload = vi.fn();
    actions(reload).backfillCovers();

    await vi.waitFor(() => expect(reload).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(
      'Assigned a cover to 1 sound',
      undefined,
    );
  });
});
