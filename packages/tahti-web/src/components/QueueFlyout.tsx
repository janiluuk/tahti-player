import { XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { formatArtistNames } from '@nuclearplayer/model';
import type { QueueItem } from '@nuclearplayer/model';
import { Button, cn, ScrollableArea } from '@nuclearplayer/ui';

type Props = {
  items: QueueItem[];
  currentId: string | null;
  onPlay: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

const HIGHLIGHT_MS = 1400;

/** Tracks ids that just entered `ids` so their row can get a brief
 * highlight -- cleared on a timer per id rather than diffed on every
 * render, so a highlight always lasts a fixed, predictable duration. */
function useNewlyAddedIds(ids: string[]) {
  const prevRef = useRef<Set<string>>(new Set(ids));
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevRef.current;
    const added = ids.filter((id) => !prev.has(id));
    prevRef.current = new Set(ids);
    if (added.length === 0) {
      return;
    }
    setNewIds((current) => new Set([...current, ...added]));
    const timer = setTimeout(() => {
      setNewIds((current) => {
        const next = new Set(current);
        for (const id of added) {
          next.delete(id);
        }
        return next;
      });
    }, HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [ids]);

  return newIds;
}

/** Queue flyout anchored above the player bar -- a vertical, scrollable
 * list (one row per track) rather than the old horizontal past/upcoming
 * strip, so a long queue is browsable and a newly-enqueued track is
 * clearly announced instead of just appearing off to the side. */
export function QueueFlyout({
  items,
  currentId,
  onPlay,
  onRemove,
  onClose,
}: Props) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const newIds = useNewlyAddedIds(ids);
  const currentIndex = currentId
    ? items.findIndex((i) => i.id === currentId)
    : -1;

  return (
    <div
      data-testid="queue-flyout"
      className="border-border bg-background shadow-shadow absolute inset-x-0 bottom-full z-40 mx-auto mb-2 flex max-h-96 w-full max-w-md flex-col overflow-hidden rounded-lg border"
    >
      <div className="border-border bg-background-secondary flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-semibold">
          Queue
          {items.length > 0 && (
            <span className="text-foreground-secondary ml-1.5 font-normal">
              ({items.length})
            </span>
          )}
        </span>
        <Button
          size="icon-sm"
          variant="text"
          onClick={onClose}
          title="Minimize queue"
          aria-label="Minimize queue"
          data-testid="minimize-queue"
        >
          <XIcon size={16} />
        </Button>
      </div>

      <div className="h-80 min-h-0">
        <ScrollableArea className="h-full">
          {items.length === 0 ? (
            <p className="text-foreground-secondary p-6 text-center text-sm">
              Queue is empty — add tracks to get started.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5 p-1.5">
              <AnimatePresence initial={false}>
                {items.map((item, index) => {
                  const isCurrent = item.id === currentId;
                  const isPast = currentIndex >= 0 && index < currentIndex;
                  const isNew = newIds.has(item.id);
                  const artist = formatArtistNames(item.track.artists);
                  const cover = item.track.artwork?.items[0]?.url;

                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginTop: 0,
                        marginBottom: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 38,
                      }}
                      className="list-none"
                    >
                      <div
                        className={cn(
                          'group flex w-full items-center gap-2 rounded-md py-1.5 pr-1 pl-2 transition-all duration-700',
                          isCurrent
                            ? 'bg-primary/10 border-l-primary border-l-2'
                            : 'hover:bg-background-secondary',
                          isPast && !isCurrent && 'opacity-60',
                          isNew && 'ring-primary/60 ring-2 ring-inset',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onPlay(item.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="bg-background-secondary size-9 shrink-0 overflow-hidden rounded">
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <span className="text-foreground-secondary flex size-full items-center justify-center text-xs">
                                ♪
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate text-sm font-medium',
                                isCurrent && 'text-primary',
                              )}
                            >
                              {item.track.title}
                            </span>
                            <span className="text-foreground-secondary block truncate text-xs">
                              {artist}
                            </span>
                          </span>
                        </button>
                        <Button
                          size="icon-sm"
                          variant="text"
                          onClick={() => onRemove(item.id)}
                          title="Remove from queue"
                          aria-label="Remove from queue"
                          className="opacity-100 transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
                        >
                          <XIcon size={14} />
                        </Button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </ScrollableArea>
      </div>
    </div>
  );
}
