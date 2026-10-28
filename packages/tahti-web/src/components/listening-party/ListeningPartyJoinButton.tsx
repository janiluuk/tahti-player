import { HeadphonesIcon, LogOutIcon, PlayIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import type { ListeningPartyState } from '../../api/listening-parties';

/** Join plays the party in this tab's player from where everyone else is.
 * Before the start it arms the page so playback begins at showtime. */
export function ListeningPartyJoinButton({
  state,
  joined,
  onJoin,
  onLeave,
}: {
  state: ListeningPartyState;
  joined: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  if (state !== 'LIVE' && state !== 'SCHEDULED') {
    return null;
  }
  if (joined) {
    return (
      <>
        <span className="text-accent-green-strong inline-flex items-center gap-1.5 text-sm font-medium">
          <HeadphonesIcon size={16} aria-hidden />
          {state === 'LIVE'
            ? 'Listening along'
            : 'You are in; playback starts at showtime'}
        </span>
        <Button size="sm" variant="secondary" onClick={onLeave}>
          <LogOutIcon size={14} aria-hidden className="mr-1.5" />
          Leave
        </Button>
      </>
    );
  }
  return (
    <Button onClick={onJoin}>
      <PlayIcon size={16} aria-hidden className="mr-1.5" />
      {state === 'LIVE' ? 'Join the party' : 'Join at the start'}
    </Button>
  );
}
