import { useState } from 'react';

import { Toggle } from '@tahti-player/ui';

import type { RtmpTarget, RtmpTargetScope } from '../api/broadcast';
import { useAuthStore } from '../stores/authStore';

const LABEL = "Keep mirroring the 24/7 rotation when I'm offline";

/** Mirrors the API gate in tahti-org `routes/me/rtmp-targets.ts`
 * (`canAlwaysMirror`): STUDIO artists and the radio channel only. */
export function canAlwaysMirror(
  tier: string | undefined,
  scope: RtmpTargetScope,
): boolean {
  return scope === 'radio' || tier === 'STUDIO';
}

/** Form state for `RtmpTarget.alwaysMirror` in a destination dialog. The
 * switch is offered to allowed tiers, and also whenever the flag is already
 * on so an account that dropped below STUDIO can still turn it off. */
export function useRotationMirror(
  existing: RtmpTarget | null,
  scope: RtmpTargetScope,
) {
  const tier = useAuthStore((state) => state.user?.tier);
  const [saved, setSaved] = useState(existing?.alwaysMirror ?? false);
  const [checked, setChecked] = useState(saved);
  const [refused, setRefused] = useState(false);
  const visible = !refused && (canAlwaysMirror(tier, scope) || saved);

  return {
    visible,
    checked,
    setChecked,
    /** The PATCH/create field, sent only when the switch actually changed so
     * an unrelated save never trips the tier gate. */
    field: (): { alwaysMirror?: boolean } =>
      visible && checked !== saved ? { alwaysMirror: checked } : {},
    commit: (value: boolean) => {
      setSaved(value);
      setChecked(value);
    },
    /** Hide the switch after the API refused a save that included it, so the
     * rest of the form can be saved again without it. */
    refuse: () => {
      setChecked(saved);
      setRefused(true);
    },
  };
}

export function RotationMirrorToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{LABEL}</span>
      <Toggle
        label={LABEL}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
