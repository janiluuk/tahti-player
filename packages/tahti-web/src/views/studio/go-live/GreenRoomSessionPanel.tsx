import { MessageSquareIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  ButtonAnchor,
  CopyButton,
  Toggle,
} from '@tahti-player/ui';

import {
  fetchGreenRoomSession,
  removeGreenRoomInvite,
  setGreenRoomSessionEnabled,
  type GreenRoomInvite,
  type GreenRoomSession,
} from '../../../api/green-room-session';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePolling } from '../../../hooks/usePolling';
import { useAuthStore } from '../../../stores/authStore';
import { GreenRoomInviteForm } from './GreenRoomInviteForm';

const REFRESH_MS = 20_000;

const SOURCE_LABEL: Record<GreenRoomInvite['source'], string> = {
  MODERATOR: 'Moderator',
  FAN_SUB: 'Fan subscriber',
  MANUAL: 'Invited',
  PUBLIC: 'Public',
};

/** The green room of the broadcast in progress: open it, see who's been
 * invited and who has joined, and take guests off the list. */
export function GreenRoomSessionPanel() {
  const username = useAuthStore((s) => s.user?.username);
  const [session, setSession] = useState<GreenRoomSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchGreenRoomSession().then((result) => {
      if (result.data) {
        setSession(result.data);
      }
    });
  }, []);

  useEffect(load, [load]);
  usePolling(load, REFRESH_MS, Boolean(session?.enabled));

  if (!session) {
    return null;
  }

  const live = session.channelState !== 'OFFLINE';

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    const result = await setGreenRoomSessionEnabled(enabled);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSession(result.data);
  };

  const remove = async (userId: string) => {
    setRemovingId(userId);
    const result = await removeGreenRoomInvite(userId);
    setRemovingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSession((current) =>
      current
        ? {
            ...current,
            invites: current.invites.filter(
              (invite) => invite.userId !== userId,
            ),
          }
        : current,
    );
  };

  const guestUrl =
    username && typeof window !== 'undefined'
      ? `${window.location.origin}/u/${username}/green-room`
      : null;

  return (
    <StudioPanel
      title="Green room"
      description="Let invited guests hear your stream before it goes public."
    >
      {username ? (
        <ButtonAnchor
          href={`/u/${encodeURIComponent(username)}/green-room`}
          size="sm"
          variant="secondary"
          className="mb-3 self-start"
        >
          <MessageSquareIcon size={14} aria-hidden />
          Open Green Room chat
        </ButtonAnchor>
      ) : null}
      {!live ? (
        <p className="text-foreground-secondary text-sm">
          Start streaming to open a green room for this broadcast.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="border-border bg-background flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span className="font-semibold">Open the green room</span>
            <Toggle
              label="Open the green room"
              checked={session.enabled}
              disabled={busy}
              onChange={(value) => void toggle(value)}
            />
          </div>
          {session.enabled && guestUrl ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-foreground-secondary min-w-0 flex-1 truncate">
                Guests join at {guestUrl}
              </span>
              <CopyButton text={guestUrl} label="Copy link" />
            </div>
          ) : null}
          {session.enabled ? (
            session.invites.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                Nobody is invited yet.
              </p>
            ) : (
              <ul
                className="divide-border divide-y text-sm"
                data-testid="green-room-invites"
              >
                {session.invites.map((invite) => (
                  <li
                    key={invite.userId}
                    className="flex items-center gap-2 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {invite.displayName || invite.username}
                    </span>
                    <Badge variant="pill" color="secondary">
                      {SOURCE_LABEL[invite.source]}
                    </Badge>
                    <Badge
                      variant="pill"
                      color={invite.joinedAt ? 'green' : 'secondary'}
                    >
                      {invite.joinedAt ? 'Joined' : 'Not joined'}
                    </Badge>
                    <Button
                      variant="text"
                      size="sm"
                      aria-label={`Remove ${invite.displayName || invite.username}`}
                      disabled={removingId === invite.userId}
                      onClick={() => void remove(invite.userId)}
                    >
                      <XIcon size={14} aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {session.enabled ? (
            <GreenRoomInviteForm
              session={session}
              onInvited={(invite) =>
                setSession((current) =>
                  current
                    ? {
                        ...current,
                        invites: [
                          ...current.invites.filter(
                            (item) => item.userId !== invite.userId,
                          ),
                          invite,
                        ],
                      }
                    : current,
                )
              }
              onSynced={setSession}
            />
          ) : null}
        </div>
      )}
    </StudioPanel>
  );
}
