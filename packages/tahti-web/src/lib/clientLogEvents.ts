import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import { logClientEvent } from './clientLogs';

/** Feeds player and session changes into Settings → Logs. */
export function startClientLogEvents(): () => void {
  let lastPlayer = usePlayerStore.getState();
  const unsubscribePlayer = usePlayerStore.subscribe((state) => {
    const prev = lastPlayer;
    lastPlayer = state;
    if (state.currentId !== prev.currentId && state.currentId) {
      const item = state.queue.find((q) => q.id === state.currentId);
      const title = item?.track.title ?? state.currentId;
      const artist = item?.track.artists.map((a) => a.name).join(', ');
      logClientEvent(
        'info',
        'playback',
        artist ? `Now playing: ${title} - ${artist}` : `Now playing: ${title}`,
      );
    }
    if (state.status !== prev.status && state.status === 'error') {
      logClientEvent(
        'error',
        'playback',
        state.error ?? 'Playback failed for an unknown reason',
      );
    }
    if (state.queue.length !== prev.queue.length) {
      logClientEvent(
        'debug',
        'queue',
        `Queue changed: ${prev.queue.length} → ${state.queue.length} items`,
      );
    }
  });

  let lastUserId = useAuthStore.getState().user?.id ?? null;
  const unsubscribeAuth = useAuthStore.subscribe((state) => {
    const userId = state.user?.id ?? null;
    if (userId === lastUserId) {
      return;
    }
    lastUserId = userId;
    logClientEvent(
      'info',
      'auth',
      state.user ? `Signed in as @${state.user.username}` : 'Signed out',
    );
  });

  return () => {
    unsubscribePlayer();
    unsubscribeAuth();
  };
}
