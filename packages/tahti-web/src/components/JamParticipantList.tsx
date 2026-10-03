import { UsersIcon } from 'lucide-react';

import { Badge, Toggle } from '@tahti-player/ui';

import type { JamParticipant } from '../api/types';

type Props = {
  participants: JamParticipant[];
  /** When set, each guest gets a "Can control" toggle (the host's view). */
  onSetControl?: (userId: string, canControl: boolean) => void;
  /** Guests whose control change is still saving. */
  pendingUserIds?: ReadonlySet<string>;
};

function nameOf(p: JamParticipant): string {
  return p.displayName?.trim() || p.username;
}

export function JamParticipantList({
  participants,
  onSetControl,
  pendingUserIds,
}: Props) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <UsersIcon size={16} className="text-foreground-secondary" />
        <h2 className="text-sm font-bold tracking-tight">
          {participants.length} jamming
        </h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {participants.map((p) => {
          const name = nameOf(p);
          const isGuest = p.role !== 'HOST';
          return (
            <li
              key={p.userId}
              className="border-border/60 bg-background-secondary/40 flex items-center gap-2 rounded-full border py-1 pr-3 pl-1"
            >
              <span className="bg-primary/20 text-primary flex size-6 items-center justify-center rounded-full text-xs font-bold">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs font-semibold">{name}</span>
              {p.role === 'HOST' && (
                <Badge variant="pill" color="blue">
                  Host
                </Badge>
              )}
              {isGuest && onSetControl ? (
                <span className="text-foreground-secondary flex items-center gap-1.5 text-xs">
                  Can control
                  <Toggle
                    checked={p.canControl === true}
                    disabled={pendingUserIds?.has(p.userId)}
                    label={`Let ${name} control playback`}
                    onChange={(checked) => onSetControl(p.userId, checked)}
                  />
                </span>
              ) : isGuest && p.canControl === true ? (
                <Badge variant="pill" color="green">
                  Can control
                </Badge>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
