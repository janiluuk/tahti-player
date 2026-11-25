import { create } from 'zustand';

export type EventBrowseItem = { id: string; title: string };

export type EventBrowseDirection = 'next' | 'previous';

export type EventNeighbours = {
  previous: EventBrowseItem | null;
  next: EventBrowseItem | null;
  position: number;
  total: number;
};

type State = {
  /** The ordered events of the row or list the event page was opened from. */
  items: EventBrowseItem[] | null;
  /** Which way the last previous/next move went, for the slide-in. */
  arrival: { eventId: string; direction: EventBrowseDirection } | null;
  remember: (items: EventBrowseItem[] | null) => void;
  arrive: (eventId: string, direction: EventBrowseDirection) => void;
};

export const useEventBrowseStore = create<State>((set) => ({
  items: null,
  arrival: null,
  remember: (items) => set({ items }),
  arrive: (eventId, direction) => set({ arrival: { eventId, direction } }),
}));

/** Previous and next event around `eventId` in `items`; null when the event
 * is not in the list or the list has nothing else to move to. The ends do
 * not wrap. */
export function resolveEventNeighbours(
  items: readonly EventBrowseItem[] | null | undefined,
  eventId: string,
): EventNeighbours | null {
  if (!items) {
    return null;
  }
  const unique = items.filter(
    (item, index) => items.findIndex((other) => other.id === item.id) === index,
  );
  const index = unique.findIndex((item) => item.id === eventId);
  if (index === -1 || unique.length < 2) {
    return null;
  }
  return {
    previous: unique[index - 1] ?? null,
    next: unique[index + 1] ?? null,
    position: index + 1,
    total: unique.length,
  };
}

export function toEventBrowseItems(
  events: readonly { id: string; title: string }[],
): EventBrowseItem[] {
  return events.map(({ id, title }) => ({ id, title }));
}
