import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  toEventBrowseItems,
  useEventBrowseStore,
  type EventBrowseItem,
} from '../../stores/eventBrowseStore';

const EventBrowseRowContext = createContext<EventBrowseItem[] | null>(null);

/** Marks `events` (in display order) as the row an event page opened from
 * inside it can step through with previous / next. */
export function EventBrowseRow({
  events,
  children,
}: {
  events: readonly { id: string; title: string }[];
  children: ReactNode;
}) {
  const items = useMemo(() => toEventBrowseItems(events), [events]);
  return (
    <EventBrowseRowContext.Provider value={items}>
      {children}
    </EventBrowseRowContext.Provider>
  );
}

/** Call the returned function when an event link in a row is followed, so
 * the event page knows which row it came from. Outside an `EventBrowseRow`
 * it forgets any earlier row. */
export function useRememberEventRow(): () => void {
  const items = useContext(EventBrowseRowContext);
  const remember = useEventBrowseStore((state) => state.remember);
  return () => remember(items);
}
