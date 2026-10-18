const listeners = new Set<() => void>();

export function subscribePressKitGalleryReload(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyPressKitGalleryReload(): void {
  for (const listener of listeners) {
    listener();
  }
}
