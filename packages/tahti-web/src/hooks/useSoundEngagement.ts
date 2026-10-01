import { useCallback, useEffect, useState } from 'react';

import {
  fetchSoundEngagement,
  setSoundEngagement,
  type SoundEngagement,
  type SoundEngagementKind,
} from '../api/sound-engagement';

export function useSoundEngagement(
  kind: SoundEngagementKind,
  slug: string | undefined,
  soundId: string,
) {
  const [state, setState] = useState<SoundEngagement | null>(null);

  useEffect(() => {
    if (!slug) {
      setState(null);
      return;
    }
    let cancelled = false;
    void fetchSoundEngagement(kind, slug, soundId).then((result) => {
      if (!cancelled) {
        setState(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kind, slug, soundId]);

  const set = useCallback(
    async (active: boolean) => {
      if (!slug) {
        return { ok: false as const, error: 'This track has no channel' };
      }
      const result = await setSoundEngagement(kind, slug, soundId, active);
      if (result.ok) {
        setState(result.data);
      }
      return result;
    },
    [kind, slug, soundId],
  );

  return { state, set };
}
