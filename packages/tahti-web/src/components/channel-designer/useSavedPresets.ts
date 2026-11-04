import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import {
  deleteChannelVisualPreset,
  fetchChannelVisualPresets,
  saveChannelVisualPreset,
  type ChannelVisualPreset,
} from '../../api/channel-design';
import type { buildVisualPatch } from './buildVisualPatch';

type Options = {
  reloadToken: number;
  buildDraftPatch: () => ReturnType<typeof buildVisualPatch>;
  hasPendingBackdropFile: boolean;
  appliedPresetName: string | null;
  clearAppliedPresetName: () => void;
};

export function useSavedPresets({
  reloadToken,
  buildDraftPatch,
  hasPendingBackdropFile,
  appliedPresetName,
  clearAppliedPresetName,
}: Options) {
  const [presets, setPresets] = useState<ChannelVisualPreset[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [presetsAttempt, setPresetsAttempt] = useState(0);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetBusy, setPresetBusy] = useState(false);
  const [deletePresetTarget, setDeletePresetTarget] =
    useState<ChannelVisualPreset | null>(null);

  useEffect(() => {
    let stale = false;
    void fetchChannelVisualPresets()
      .then(({ data, meta }) => {
        if (!stale) {
          setPresets(data);
          setPresetsError(meta.source === 'api' ? (meta.reason ?? null) : null);
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [reloadToken, presetsAttempt]);

  const openSavePresetModal = () => {
    if (hasPendingBackdropFile) {
      toast.error(i18n.t('web:toasts.presetPendingBackdrop'));
      return;
    }
    setPresetNameInput('');
    setSavePresetOpen(true);
  };

  const confirmSavePreset = async () => {
    const name = presetNameInput.trim();
    if (!name) {
      toast.error(i18n.t('web:toasts.presetNameRequired'));
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
      toast.error(i18n.t('web:toasts.presetSaveFailed'));
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
    toast.success(i18n.t('web:toasts.presetSavedNamed', { name }));
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
      toast.error(i18n.t('web:toasts.presetDeleteFailed'));
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
    toast.success(
      i18n.t('web:toasts.presetDeletedNamed', { name: target.name }),
    );
    setDeletePresetTarget(null);
  };

  return {
    presets,
    presetsError,
    retryPresets: () => setPresetsAttempt((n) => n + 1),
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
