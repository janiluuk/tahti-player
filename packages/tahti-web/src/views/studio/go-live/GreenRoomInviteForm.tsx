import { UserPlusIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

import {
  inviteToGreenRoom,
  syncGreenRoomInvites,
  type GreenRoomInvite,
  type GreenRoomSession,
} from '../../../api/green-room-session';

const CANDIDATE_LABEL = { MODERATOR: 'moderator', FAN_SUB: 'fan subscriber' };

/** Add guests to an open green room: by handle, from the suggested
 * moderators and fan subscribers, or everyone new in the invite pool. */
export function GreenRoomInviteForm({
  session,
  onInvited,
  onSynced,
}: {
  session: GreenRoomSession;
  onInvited: (invite: GreenRoomInvite) => void;
  onSynced: (session: GreenRoomSession) => void;
}) {
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const invite = async (username: string) => {
    setBusy(username);
    const result = await inviteToGreenRoom(username);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    onInvited(result.data);
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const username = handle.trim().replace(/^@/, '');
    if (username && (await invite(username))) {
      setHandle('');
    }
  };

  const sync = async () => {
    setBusy('sync');
    const result = await syncGreenRoomInvites();
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onSynced(result.data);
  };

  const invited = new Set(session.invites.map((item) => item.userId));
  const suggestions = session.candidates.filter(
    (candidate) => !invited.has(candidate.userId),
  );

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-3">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => void submit(event)}
      >
        <div className="min-w-0 flex-1">
          <Input
            label="Invite by handle"
            placeholder="@username"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={busy !== null || !handle.trim()}
        >
          Invite
        </Button>
      </form>
      {suggestions.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Suggested guests">
          {suggestions.map((candidate) => (
            <li key={candidate.userId}>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy !== null}
                onClick={() => void invite(candidate.username)}
              >
                <UserPlusIcon size={14} aria-hidden className="mr-1" />
                {candidate.displayName || candidate.username} (
                {CANDIDATE_LABEL[candidate.kind]})
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {session.invitePool !== 'MANUAL_ONLY' ? (
        <Button
          variant="text"
          size="sm"
          className="self-start"
          disabled={busy !== null}
          onClick={() => void sync()}
        >
          {busy === 'sync'
            ? 'Updating…'
            : 'Invite anyone new from my invite pool'}
        </Button>
      ) : null}
    </div>
  );
}
