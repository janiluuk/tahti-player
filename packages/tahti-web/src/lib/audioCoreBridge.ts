import {
  clearExternalAnalyser,
  setExternalAnalyser,
} from '@tahti-player/audio-core';

import { usePlayerStore } from '../stores/playerStore';

let subscribed = false;

export function ensureAudioCoreBridge(): void {
  if (subscribed || typeof window === 'undefined') {
    return;
  }
  subscribed = true;
  const sync = (analyser: AnalyserNode | null) => {
    if (analyser) {
      setExternalAnalyser(analyser, analyser.context as AudioContext);
    } else {
      clearExternalAnalyser();
    }
  };
  sync(usePlayerStore.getState().analyser);
  usePlayerStore.subscribe((state, prev) => {
    if (state.analyser !== prev.analyser) {
      sync(state.analyser);
    }
  });
}
