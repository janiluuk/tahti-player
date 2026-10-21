import { useState } from 'react';
import { toast } from 'sonner';

import { fillColorScheme, patchChannelVisual } from '../../api/channel-design';
import type { ChannelLookBundle } from '../../lib/channelPageLayout';

export type PresetLookDraft = { token: number; look: ChannelLookBundle };

/** A layout preset's look while it is an unsaved draft: handed to the
 * embedded designer (which applies it to its own draft), and saved with
 * Save/Done like any other look edit. `note` tells the owner so. */
export function usePresetLookDraft() {
  const [pending, setPending] = useState<PresetLookDraft | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const stage = (name: string, look: ChannelLookBundle) => {
    setPending({ token: Date.now(), look });
    setNote(`Applied "${name}" — save to keep it.`);
  };

  /** Saves the pending look straight to the server, for when the look
   * panel (and so the designer) is closed. True when it was saved. */
  const saveDirectly = async () => {
    if (!pending) {
      return false;
    }
    const { look } = pending;
    const result = await patchChannelVisual({
      visualPreset: look.visualPreset,
      headerStyle: look.headerStyle,
      brandAccentPreset: look.brandAccentPreset,
      colorScheme: fillColorScheme(look.colorScheme),
    });
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setPending(null);
    return true;
  };

  return {
    pending,
    note,
    setNote,
    stage,
    clearPending: () => setPending(null),
    saveDirectly,
  };
}
