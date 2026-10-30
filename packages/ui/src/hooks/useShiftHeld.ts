import { useSyncExternalStore } from 'react';

let shiftHeld = false;
const listeners = new Set<() => void>();

function setShiftHeld(next: boolean) {
  if (next === shiftHeld) {
    return;
  }
  shiftHeld = next;
  for (const listener of listeners) {
    listener();
  }
}

function syncFromKeyboard(event: KeyboardEvent) {
  setShiftHeld(event.getModifierState('Shift'));
}

function syncFromPointer(event: PointerEvent) {
  setShiftHeld(event.shiftKey);
}

function clearShift() {
  setShiftHeld(false);
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (listeners.size === 1 && typeof window !== 'undefined') {
    window.addEventListener('keydown', syncFromKeyboard);
    window.addEventListener('keyup', syncFromKeyboard);
    window.addEventListener('pointermove', syncFromPointer);
    window.addEventListener('blur', clearShift);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('keydown', syncFromKeyboard);
      window.removeEventListener('keyup', syncFromKeyboard);
      window.removeEventListener('pointermove', syncFromPointer);
      window.removeEventListener('blur', clearShift);
      setShiftHeld(false);
    }
  };
}

const getSnapshot = () => shiftHeld;
const getServerSnapshot = () => false;

/** True while the Shift key is held. Shared across mounts via one window
 * listener; pointer moves also sync it, so Shift held before the window had
 * focus still counts. */
export function useShiftHeld(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
