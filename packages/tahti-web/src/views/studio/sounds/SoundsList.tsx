import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

import type { StudioSound } from '../../../api/studio-types';
import { SoundRow } from './SoundRow';
import type { StudioSoundsState } from './useStudioSoundsState';

/** Match QueuePanel: keep small lists fully mounted; virtualize large archives. */
const VIRTUALIZE_THRESHOLD = 200;
const ROW_ESTIMATE_PX = 72;
const OVERSCAN_ROWS = 8;

export function SoundsList({
  items,
  state,
}: {
  items: StudioSound[];
  state: StudioSoundsState;
}) {
  const virtualize = items.length > VIRTUALIZE_THRESHOLD;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: virtualize ? items.length : 0,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_ESTIMATE_PX,
    getItemKey: (index) => items[index]?.id ?? index,
    overscan: OVERSCAN_ROWS,
  });

  if (!virtualize) {
    return (
      <ul className="divide-border divide-y">
        {items.map((item) => (
          <SoundRow key={item.id} item={item} state={state} />
        ))}
      </ul>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="max-h-[min(70vh,40rem)] overflow-y-auto"
      data-testid="studio-sounds-virtual-list"
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) {
            return null;
          }
          return (
            <div
              key={item.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="divide-border absolute top-0 left-0 w-full divide-y border-b"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <ul>
                <SoundRow item={item} state={state} />
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
