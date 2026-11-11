import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import {
  backfillStudioSoundCovers,
  bulkDeleteStudioSounds,
  bulkPatchStudioSounds,
  deleteStudioSound,
  fetchStudioSoundIds,
  fetchStudioSoundsPage,
  STUDIO_SOUND_BULK_MAX_IDS,
  type StudioSoundBulkPatch,
  type StudioSoundListFilter,
} from '../../../api/studio';
import type { StudioSound } from '../../../api/studio-types';

export type BulkConfirmMismatch = {
  totalMatched: number;
  kind: 'delete' | 'patch';
  patch?: StudioSoundBulkPatch;
};

export type BulkTarget =
  | { ids: string[] }
  | { filter: StudioSoundListFilter; confirmTotal: number; all?: boolean };

type BulkDeps = {
  bulkBusy: boolean;
  setBulkBusy: (busy: boolean) => void;
  coversBusy: boolean;
  setCoversBusy: (busy: boolean) => void;
  serverFilter: StudioSoundListFilter;
  total: number;
  items: StudioSound[];
  selectedIds: Set<string>;
  allMatchingSelected: boolean;
  setSelectedIds: (
    value: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  setAllMatchingSelected: (value: boolean) => void;
  setSelectingAll: (value: boolean) => void;
  setSelectionNotice: (value: string | null) => void;
  setPendingBulkDelete: (value: boolean) => void;
  setBulkConfirmMismatch: (value: BulkConfirmMismatch | null) => void;
  setBulkEditOpen: (value: boolean) => void;
  bulkConfirmMismatch: BulkConfirmMismatch | null;
  pendingDeleteItem: StudioSound | null;
  setPendingDeleteItem: (value: StudioSound | null) => void;
  requestSeq: { current: number };
  listSort: 'newest' | 'oldest' | 'title' | 'duration';
  clearSelection: () => void;
  reload: () => void;
};

export function createStudioSoundsBulkActions(deps: BulkDeps) {
  const filterNarrows = Object.keys(deps.serverFilter).length > 0;

  const buildBulkTarget = (): BulkTarget | { error: string } => {
    if (deps.allMatchingSelected) {
      return {
        filter: deps.serverFilter,
        confirmTotal: deps.total,
        ...(filterNarrows ? {} : { all: true as const }),
      };
    }
    const ids = [...deps.selectedIds];
    if (ids.length === 0) {
      return { error: 'No sounds selected.' };
    }
    if (ids.length > STUDIO_SOUND_BULK_MAX_IDS) {
      return {
        error: `Select at most ${STUDIO_SOUND_BULK_MAX_IDS} sounds, or use “Select all matching” with a filter.`,
      };
    }
    return { ids };
  };

  const selectAllMatching = async () => {
    const seq = deps.requestSeq.current;
    const filterSnapshot = deps.serverFilter;
    deps.setSelectingAll(true);
    deps.setSelectionNotice(null);
    try {
      const result = await fetchStudioSoundIds(filterSnapshot);
      if (seq !== deps.requestSeq.current) {
        return;
      }
      if (result.tooLarge) {
        deps.setSelectionNotice(
          i18n.t('web:library.soundsSelectCap', {
            total: result.tooLarge.totalMatched,
          }),
        );
        toast.error(result.tooLarge.error);
        return;
      }
      if (result.meta.source === 'api' && result.meta.reason) {
        toast.error(result.meta.reason);
        return;
      }
      deps.setSelectedIds(new Set(result.data.ids));
      deps.setAllMatchingSelected(true);
      toast.success(
        i18n.t('web:toasts.soundsSelected', { count: result.data.total }),
      );
    } finally {
      if (seq === deps.requestSeq.current) {
        deps.setSelectingAll(false);
      }
    }
  };

  const confirmDelete = () => {
    const item = deps.pendingDeleteItem;
    deps.setPendingDeleteItem(null);
    if (!item) {
      return;
    }
    void (async () => {
      try {
        const result = await deleteStudioSound(item.id);
        if (result && 'ok' in result && !result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(i18n.t('web:toasts.deletedSound', { title: item.title }));
        deps.setSelectedIds((prev) => {
          if (!prev.has(item.id)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        deps.setAllMatchingSelected(false);
        deps.reload();
      } catch {
        toast.error(i18n.t('web:toasts.couldNotDeleteTrack'));
      }
    })();
  };

  const runBulkDelete = (target: BulkTarget) => {
    if (deps.bulkBusy) {
      return;
    }
    deps.setBulkBusy(true);
    void (async () => {
      try {
        const result = await bulkDeleteStudioSounds(target);
        if (!result.ok) {
          if (result.totalMatched !== undefined && 'filter' in target) {
            deps.setBulkConfirmMismatch({
              totalMatched: result.totalMatched,
              kind: 'delete',
            });
            return;
          }
          toast.error(result.error);
          return;
        }
        const failedCount = result.data.failed.length;
        if (failedCount > 0) {
          toast.warning(
            i18n.t('web:toasts.deletedSoundsPartial', {
              deleted: result.data.deleted,
              failed: failedCount,
            }),
          );
        } else {
          toast.success(
            i18n.t('web:toasts.deletedSounds', { count: result.data.deleted }),
          );
        }
        deps.clearSelection();
        deps.reload();
      } finally {
        deps.setBulkBusy(false);
      }
    })();
  };

  const runBulkPatch = (target: BulkTarget, patch: StudioSoundBulkPatch) => {
    if (deps.bulkBusy) {
      return;
    }
    deps.setBulkBusy(true);
    void (async () => {
      try {
        const result = await bulkPatchStudioSounds(
          'ids' in target ? { ids: target.ids, patch } : { ...target, patch },
        );
        if (!result.ok) {
          if (result.totalMatched !== undefined && 'filter' in target) {
            deps.setBulkConfirmMismatch({
              totalMatched: result.totalMatched,
              kind: 'patch',
              patch,
            });
            return;
          }
          toast.error(result.error);
          return;
        }
        const failedCount = result.data.failed.length;
        if (failedCount > 0) {
          toast.warning(
            i18n.t('web:toasts.updatedSoundsPartial', {
              updated: result.data.updated,
              failed: failedCount,
            }),
          );
        } else {
          toast.success(
            i18n.t('web:toasts.updatedSounds', { count: result.data.updated }),
          );
        }
        deps.setBulkEditOpen(false);
        deps.reload();
      } finally {
        deps.setBulkBusy(false);
      }
    })();
  };

  const confirmBulkDelete = () => {
    deps.setPendingBulkDelete(false);
    const target = buildBulkTarget();
    if ('error' in target) {
      toast.error(target.error);
      return;
    }
    runBulkDelete(target);
  };

  const confirmBulkMismatch = () => {
    const pending = deps.bulkConfirmMismatch;
    deps.setBulkConfirmMismatch(null);
    if (!pending) {
      return;
    }
    const target = {
      filter: deps.serverFilter,
      confirmTotal: pending.totalMatched,
      ...(Object.keys(deps.serverFilter).length > 0
        ? {}
        : { all: true as const }),
    };
    if (pending.kind === 'delete') {
      runBulkDelete(target);
      return;
    }
    if (pending.patch) {
      runBulkPatch(target, pending.patch);
    }
  };

  const applyBulkEdit = (patch: StudioSoundBulkPatch) => {
    const target = buildBulkTarget();
    if ('error' in target) {
      toast.error(target.error);
      return;
    }
    runBulkPatch(target, patch);
  };

  const tracksForRelease = async (): Promise<
    Array<{ id: string; title: string }>
  > => {
    const titles = new Map(
      deps.items.map((item) => [item.id, item.title] as const),
    );
    const missing = [...deps.selectedIds].filter((id) => !titles.has(id));
    if (missing.length > 0) {
      const pageSize = 50;
      let offset = 0;
      while (missing.some((id) => !titles.has(id)) && offset < deps.total) {
        const page = await fetchStudioSoundsPage({
          ...deps.serverFilter,
          sort: deps.listSort,
          limit: pageSize,
          offset,
        });
        for (const item of page.data.items) {
          titles.set(item.id, item.title);
        }
        if (page.data.items.length === 0) {
          break;
        }
        offset += page.data.items.length;
      }
    }
    return [...deps.selectedIds].map((id) => ({
      id,
      title: titles.get(id) ?? id,
    }));
  };

  const backfillCovers = () => {
    if (deps.coversBusy || deps.bulkBusy) {
      return;
    }
    deps.setCoversBusy(true);
    void (async () => {
      try {
        const result = await backfillStudioSoundCovers();
        if (!result.ok) {
          toast.error(
            result.error || i18n.t('web:library.coversBackfillError'),
          );
          return;
        }
        if (result.data.assigned === 0) {
          toast.message(i18n.t('web:library.coversBackfillNone'));
        } else {
          const { fromProvider, fromPresets } = result.data;
          toast.success(
            i18n.t('web:library.coversBackfillDone', {
              count: result.data.assigned,
            }),
            fromProvider != null && fromPresets != null
              ? {
                  description: i18n.t('web:library.coversBackfillSources', {
                    provider: fromProvider,
                    presets: fromPresets,
                  }),
                }
              : undefined,
          );
        }
        deps.reload();
      } finally {
        deps.setCoversBusy(false);
      }
    })();
  };

  return {
    selectAllMatching,
    confirmDelete,
    confirmBulkDelete,
    confirmBulkMismatch,
    applyBulkEdit,
    tracksForRelease,
    backfillCovers,
  };
}
