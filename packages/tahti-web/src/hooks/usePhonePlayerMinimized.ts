import { useCallback, useSyncExternalStore } from 'react';

export const PHONE_PLAYER_MINIMIZED_KEY = 'tahti-web:phone-player-minimized';

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(PHONE_PLAYER_MINIMIZED_KEY) === '1';
  } catch {
    return false;
  }
}

let current: boolean | null = null;

function snapshot(): boolean {
  if (current === null) {
    current = read();
  }
  return current;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PHONE_PLAYER_MINIMIZED_KEY) {
      current = read();
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function setPhonePlayerMinimized(minimized: boolean): void {
  current = minimized;
  try {
    if (minimized) {
      window.localStorage.setItem(PHONE_PLAYER_MINIMIZED_KEY, '1');
    } else {
      window.localStorage.removeItem(PHONE_PLAYER_MINIMIZED_KEY);
    }
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  for (const listener of [...listeners]) {
    listener();
  }
}

/** Test and story hook: forget the cached value so the next read sees
 * whatever localStorage holds now. */
export function resetPhonePlayerMinimizedCache(): void {
  current = null;
}

/** Whether the listener collapsed the phone player bar to its mini strip,
 * remembered per browser. */
export function usePhonePlayerMinimized(): [boolean, (next: boolean) => void] {
  const minimized = useSyncExternalStore(subscribe, snapshot, () => false);
  const set = useCallback((next: boolean) => setPhonePlayerMinimized(next), []);
  return [minimized, set];
}
