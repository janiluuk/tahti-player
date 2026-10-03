import { useLayoutEffect, useRef } from 'react';

import { Button } from '@tahti-player/ui';

import type { ChatDm } from '../api/messages';
import { DmRoleBadge } from './DmRoleBadge';

type Props = {
  messages: ChatDm[];
  hasMore: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
};

export function DmThreadMessages({
  messages,
  hasMore,
  loadingOlder,
  onLoadOlder,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const distanceFromBottom = useRef<number | null>(null);

  // Prepending older messages grows the list above the viewport; keeping the
  // same distance from the bottom leaves the reader where they were.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || distanceFromBottom.current === null) {
      return;
    }
    el.scrollTop = el.scrollHeight - distanceFromBottom.current;
    distanceFromBottom.current = null;
  }, [messages]);

  const loadOlder = () => {
    const el = scrollRef.current;
    if (el) {
      distanceFromBottom.current = el.scrollHeight - el.scrollTop;
    }
    onLoadOlder();
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-2 overflow-y-auto p-3 text-sm"
    >
      {hasMore && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="text"
            disabled={loadingOlder}
            onClick={loadOlder}
          >
            {loadingOlder ? 'Loading…' : 'Load older messages'}
          </Button>
        </div>
      )}
      {messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[85%] rounded-lg px-3 py-2 ${
            m.isMine
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'border-accent-purple/30 bg-accent-purple/15'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px]">
            <span className="opacity-70">{m.senderDisplayName}</span>
            {m.isMine ? null : <DmRoleBadge role={m.senderChannelRole} />}
          </div>
          {m.body}
        </div>
      ))}
    </div>
  );
}
