import { useNavigate } from '@tanstack/react-router';
import { LogOutIcon, PlayIcon, UsersIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  TahtiJam,
} from '@tahti-player/ui';

import { endJam, joinJam, leaveJam } from '../api/jam';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import {
  useJamGuestPlayback,
  useJamHostSync,
  useJamState,
} from '../hooks/useJam';
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
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  useJamHostSync(sessionId, isHost && !ended);
  useJamGuestPlayback(session, !isHost && audioUnlocked && !ended);

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
          {!isHost && !audioUnlocked && track?.streamUrl ? (
            <Button onClick={() => setAudioUnlocked(true)}>
              <PlayIcon size={16} /> Play along
            </Button>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <div className="mb-3 flex items-center gap-2">
            <UsersIcon size={16} className="text-foreground-secondary" />
            <h2 className="text-sm font-bold tracking-tight">
              {session.participants.length} jamming
            </h2>
          </div>
          <ul className="flex flex-wrap gap-2">
            {session.participants.map((p) => (
              <li
                key={p.userId}
                className="border-border/60 bg-background-secondary/40 flex items-center gap-2 rounded-full border py-1 pr-3 pl-1"
              >
                <span className="bg-primary/20 text-primary flex size-6 items-center justify-center rounded-full text-xs font-bold">
                  {p.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-semibold">{p.displayName}</span>
                {p.role === 'HOST' && (
                  <Badge variant="pill" color="blue">
                    Host
                  </Badge>
                )}
              </li>
            ))}
          </ul>
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
