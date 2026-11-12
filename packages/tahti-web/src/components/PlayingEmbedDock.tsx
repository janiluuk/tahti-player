import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';

import { playableFromQueueItem, usePlayerStore } from '../stores/playerStore';
import { EmbedSurface } from './EmbedSurface';

type Slot = {
  id: string;
  element: HTMLElement;
  priority: number;
};

let slots: Slot[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function winningSlot(): HTMLElement | null {
  if (slots.length === 0) {
    return null;
  }
  return slots.reduce((best, slot) =>
    slot.priority >= best.priority ? slot : best,
  ).element;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function registerSlot(slot: Slot) {
  slots = [...slots.filter((item) => item.id !== slot.id), slot];
  emit();
  return () => {
    slots = slots.filter((item) => item.id !== slot.id);
    emit();
  };
}

/** A visible home for the playing embed. The dock keeps one iframe and
 * paints it over this box; leaving the page does not reload the widget. */
export function EmbedSlot({
  id,
  priority,
  className,
  testId,
}: {
  id: string;
  priority: number;
  className?: string;
  testId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    return registerSlot({ id, element, priority });
  }, [id, priority]);
  return (
    <div
      ref={ref}
      className={className}
      data-testid={testId}
      style={{ minHeight: 150 }}
    />
  );
}

function placeOver(holder: HTMLElement, slot: HTMLElement | null) {
  if (!slot) {
    holder.style.position = 'absolute';
    holder.style.width = '0';
    holder.style.height = '0';
    holder.style.overflow = 'hidden';
    holder.style.pointerEvents = 'none';
    return;
  }
  const rect = slot.getBoundingClientRect();
  holder.style.position = 'fixed';
  holder.style.top = `${rect.top}px`;
  holder.style.left = `${rect.left}px`;
  holder.style.width = `${rect.width}px`;
  holder.style.height = '150px';
  holder.style.overflow = 'visible';
  holder.style.pointerEvents = 'auto';
  holder.style.zIndex = '40';
}

/** Owns the iframe for the current embed-only track. Stage, the player
 * bar, and the full-screen player are slots; this component stays mounted. */
export function PlayingEmbedDock() {
  const holderRef = useRef<HTMLDivElement>(null);
  const slot = useSyncExternalStore(subscribe, winningSlot, winningSlot);
  const currentId = usePlayerStore((s) => s.currentId);
  const queue = usePlayerStore((s) => s.queue);
  const restoredPending = usePlayerStore((s) => s.restoredPending);
  const reloadNonce = usePlayerStore((s) => s.reloadNonce);
  const item = currentId
    ? queue.find((entry) => entry.id === currentId)
    : undefined;
  const playable = item ? playableFromQueueItem(item) : null;
  const embed = playable?.embed;

  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!holder) {
      return;
    }
    placeOver(holder, slot);
    if (!slot) {
      return;
    }
    const place = () => placeOver(holder, slot);
    const observer = new ResizeObserver(place);
    observer.observe(slot);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [slot]);

  return (
    <div ref={holderRef} data-testid="playing-embed-holder">
      {embed?.embedUri ? (
        <EmbedSurface
          provider={embed.provider}
          embedUri={embed.embedUri}
          title={playable?.title ?? ''}
          autoplay={restoredPending !== playable?.id}
          mountKey={reloadNonce}
        />
      ) : null}
    </div>
  );
}
