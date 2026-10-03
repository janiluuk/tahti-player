import { useNavigate } from '@tanstack/react-router';
import { LogOutIcon, PauseIcon, PlayIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  TahtiJam,
} from '@tahti-player/ui';

import {
  endJam,
  joinJam,
  leaveJam,
  pushJamState,
  setJamParticipantControl,
} from '../api/jam';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import { JamParticipantList } from '../components/JamParticipantList';
import { useJamGuestPlayback, useJamState } from '../hooks/useJam';
import { useJamCoControl, useJamHostSync } from '../hooks/useJamControl';
import { canControlJam, toggledJamState } from '../lib/jamPlayback';
import { useAuthStore } from '../stores/authStore';

/** A frosted glass panel whose glow tints toward the current track's own
 * ambience — same idea as the Channel Designer's cover-reactive preview,
 * applied to Jam's content cards instead of a page background. */
function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border/60 bg-background/40 shadow-primary/10 rounded-2xl border p-5 shadow-[0_0_60px_-20px_var(--tw-shadow-color)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function JamView({ code }: { code: string }) {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void joinJam(code)
      .then((session) => {
        if (!cancelled) {
          setSessionId(session.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJoinError('This Jam link is invalid or has ended.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const { session, connectionStatus, ended } = useJamState(sessionId);
  const isHost = Boolean(session && userId && session.hostUserId === userId);
  const canControl = Boolean(session && canControlJam(session, userId));
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [controlSupported, setControlSupported] = useState(true);
  const [pendingControl, setPendingControl] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  useJamHostSync(session, isHost && !ended);
  useJamGuestPlayback(session, !isHost && audioUnlocked && !ended);
  useJamCoControl(session, !isHost && canControl && audioUnlocked && !ended);

  const setGuestControl = async (guestId: string, allow: boolean) => {
    if (!sessionId) {
      return;
    }
    setPendingControl((prev) => new Set(prev).add(guestId));
    const updated = await setJamParticipantControl(sessionId, guestId, allow);
    setPendingControl((prev) => {
      const next = new Set(prev);
      next.delete(guestId);
      return next;
    });
    if (!updated) {
      setControlSupported(false);
      toast.error("Couldn't change who controls this Jam.");
    }
  };

  const togglePlaybackForEveryone = async () => {
    if (!session) {
      return;
    }
    await pushJamState(session.id, toggledJamState(session)).catch(() => {
      toast.error("Couldn't change playback for the Jam.");
    });
  };

  const leave = async () => {
    if (sessionId) {
      await leaveJam(sessionId).catch(() => {});
    }
    void navigate({ to: '/' });
  };

  const endForEveryone = async () => {
    if (sessionId) {
      await endJam(sessionId).catch(() => {});
    }
    void navigate({ to: '/' });
  };

  if (joinError) {
    return (
      <TahtiJam>
        <TahtiJam.Error
          labels={{ title: 'Jam not found', subtitle: joinError }}
        />
      </TahtiJam>
    );
  }

  if (ended) {
    return (
      <TahtiJam>
        <EmptyState
          icon={<XIcon size={48} />}
          title="This Jam has ended"
          description="The host closed the session."
          className="flex-1"
        />
      </TahtiJam>
    );
  }

  if (!session || connectionStatus === 'connecting') {
    return (
      <TahtiJam>
        <TahtiJam.Connecting
          labels={{
            title: 'Joining the Jam…',
            subtitle: 'Syncing with the host',
          }}
        />
      </TahtiJam>
    );
  }

  const track = session.currentTrack;

  return (
    <TahtiJam className="relative h-full">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <ChannelVisualizer
          artworkUrl={track?.coverUrl}
          audioReactive={false}
          className="size-full"
        />
      </div>
      <div className="from-background/40 via-background/70 to-background pointer-events-none absolute inset-0 bg-gradient-to-b" />

      <div className="relative flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <GlassPanel className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-bold tracking-tight">
              Tahti Jam
            </h1>
            <Badge
              variant="pill"
              color={connectionStatus === 'connected' ? 'green' : 'yellow'}
            >
              {connectionStatus === 'connected'
                ? 'Live'
                : connectionStatus === 'reconnecting'
                  ? 'Reconnecting…'
                  : 'Connecting…'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground-secondary hidden text-xs font-semibold tracking-wide uppercase sm:inline">
              Code
            </span>
            <code className="bg-background-secondary/60 rounded px-2 py-1 text-sm font-bold tracking-widest">
              {session.code}
            </code>
            <CopyButton
              text={`${window.location.origin}/jam/${session.code}`}
            />
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-wrap items-center justify-between gap-3">
          <TahtiJam.NowPlaying
            title={track?.title ?? 'Nothing playing yet'}
            artist={track?.artistName}
            coverUrl={track?.coverUrl ?? undefined}
          />
          <div className="flex flex-wrap items-center gap-2">
            {canControl && track ? (
              <Button
                variant="secondary"
                onClick={() => void togglePlaybackForEveryone()}
              >
                {session.isPlaying ? (
                  <>
                    <PauseIcon size={16} /> Pause for everyone
                  </>
                ) : (
                  <>
                    <PlayIcon size={16} /> Play for everyone
                  </>
                )}
              </Button>
            ) : null}
            {!isHost && !audioUnlocked && track?.streamUrl ? (
              <Button onClick={() => setAudioUnlocked(true)}>
                <PlayIcon size={16} /> Play along
              </Button>
            ) : null}
          </div>
          {!isHost && canControl ? (
            <p className="text-foreground-secondary w-full text-xs">
              The host has given you control of playback
              {audioUnlocked
                ? ' - pausing or resuming your player does it for everyone.'
                : '.'}
            </p>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <JamParticipantList
            participants={session.participants}
            onSetControl={
              isHost && controlSupported
                ? (guestId, allow) => void setGuestControl(guestId, allow)
                : undefined
            }
            pendingUserIds={pendingControl}
          />
        </GlassPanel>

        <div className="mt-auto flex justify-end gap-2">
          {isHost ? (
            <Button
              variant="secondary"
              className="text-accent-red-strong border-accent-red/40 hover:bg-accent-red/10"
              onClick={() => void endForEveryone()}
            >
              <XIcon size={16} /> End Jam for everyone
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void leave()}>
              <LogOutIcon size={16} /> Leave Jam
            </Button>
          )}
        </div>
      </div>
    </TahtiJam>
  );
}
