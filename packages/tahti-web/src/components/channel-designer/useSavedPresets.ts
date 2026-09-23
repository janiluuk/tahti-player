import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  deleteChannelVisualPreset,
  fetchChannelVisualPresets,
  saveChannelVisualPreset,
  type ChannelVisualPreset,
} from '../../api/channel-design';
import type { buildVisualPatch } from './buildVisualPatch';

type Options = {
  reloadToken: number;
  /** Patch of the current draft, as `buildVisualPatch` makes it. */
  buildDraftPatch: () => ReturnType<typeof buildVisualPatch>;
  hasPendingBackdropFile: boolean;
  appliedPresetName: string | null;
  clearAppliedPresetName: () => void;
};

/** The owner's saved looks: list, save-as dialog and delete confirm. */
export function useSavedPresets({
  reloadToken,
  buildDraftPatch,
  hasPendingBackdropFile,
  appliedPresetName,
  clearAppliedPresetName,
}: Options) {
  const [presets, setPresets] = useState<ChannelVisualPreset[]>([]);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetBusy, setPresetBusy] = useState(false);
  const [deletePresetTarget, setDeletePresetTarget] =
    useState<ChannelVisualPreset | null>(null);

  useEffect(() => {
    let stale = false;
    void fetchChannelVisualPresets()
      .then(({ data }) => {
        if (!stale) {
          setPresets(data);
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [reloadToken]);

  const openSavePresetModal = () => {
    if (hasPendingBackdropFile) {
      toast.error(
        'Upload or clear the pending backdrop file before saving a preset.',
      );
      return;
    }
    setPresetNameInput('');
    setSavePresetOpen(true);
  };

  const confirmSavePreset = async () => {
    const name = presetNameInput.trim();
    if (!name) {
      toast.error('Give the preset a name.');
      return;
    }
    const patch = buildDraftPatch();
    if (!patch) {
      return;
    }
    setPresetBusy(true);
    let result: Awaited<ReturnType<typeof saveChannelVisualPreset>>;
    try {
      result = await saveChannelVisualPreset(name, patch);
    } catch {
      toast.error('Could not save the preset. Try again.');
      return;
    } finally {
      setPresetBusy(false);
    }
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPresets((prev) => [
      result.data,
      ...prev.filter((p) => p.id !== result.data.id),
    ]);
    toast.success(`Saved "${name}"`);
    setSavePresetOpen(false);
  };

  const confirmDeletePreset = async () => {
    if (!deletePresetTarget) {
      return;
    }
    const target = deletePresetTarget;
    setPresetBusy(true);
    let result: Awaited<ReturnType<typeof deleteChannelVisualPreset>>;
    try {
      result = await deleteChannelVisualPreset(target.id);
    } catch {
      toast.error('Could not delete the preset. Try again.');
      return;
    } finally {
      setPresetBusy(false);
    }
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPresets((prev) => prev.filter((p) => p.id !== target.id));
    if (appliedPresetName === target.name) {
      clearAppliedPresetName();
    }
    toast.success(`Deleted "${target.name}"`);
    setDeletePresetTarget(null);
  };

  return {
    presets,
    savePresetOpen,
    setSavePresetOpen,
    presetNameInput,
    setPresetNameInput,
    presetBusy,
    deletePresetTarget,
    setDeletePresetTarget,
    openSavePresetModal,
    confirmSavePreset,
    confirmDeletePreset,
  };
}
