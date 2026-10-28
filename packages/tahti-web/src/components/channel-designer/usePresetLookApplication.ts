import { useEffect, useRef } from 'react';

import { fillColorScheme } from '../../api/channel-design';
import type { ChannelLookBundle } from '../../lib/channelPageLayout';
import type { useChannelLook } from './useChannelLook';

export function usePresetLookApplication(
  presetLook: { token: number; look: ChannelLookBundle } | null | undefined,
  loaded: boolean,
  applyLocal: ReturnType<typeof useChannelLook>['applyLocal'],
) {
  const appliedToken = useRef<number | null>(null);
  useEffect(() => {
    if (!presetLook || !loaded || appliedToken.current === presetLook.token) {
      return;
    }
    appliedToken.current = presetLook.token;
    const { look } = presetLook;
    applyLocal(
      {
        visualPreset: look.visualPreset,
        headerStyle: look.headerStyle,
        brandAccentPreset: look.brandAccentPreset,
      },
      fillColorScheme(look.colorScheme),
    );
  }, [presetLook, loaded, applyLocal]);
}
