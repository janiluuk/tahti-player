import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button } from '@tahti-player/ui';

import {
  fetchDeviceSessions,
  revokeAllDeviceSessions,
  revokeDeviceSession,
  type DeviceSession,
} from '../api/sessions';
import { ConfirmDialog } from './ConfirmDialog';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

function formatWhen(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DevicesSessionsPanel() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<DeviceSession | null>(null);
  const [signOutAll, setSignOutAll] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    void fetchDeviceSessions().then((result) => {
      setSessions(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, [attempt]);

  if (loading) {
    return <PageLoading label="Loading devices…" />;
  }

  if (loadError && sessions.length === 0) {
    return (
      <PageError
        title="Could not load devices"
        description={loadError}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (sessions.length === 0) {
    return (
      <PageEmpty
        title="No signed-in devices"
        description="Sessions appear here after you sign in on a browser or app."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {loadError ? (
        <PageErrorBanner
          title="Could not refresh your devices"
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-foreground/80 text-sm">
          Each sign-in keeps its own session. Signing in elsewhere no longer
          signs you out here.
        </p>
        <Button
          size="sm"
          intent="danger"
          disabled={busy}
          onClick={() => setSignOutAll(true)}
        >
          Sign out everywhere
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="border-border flex flex-wrap items-center justify-between gap-3 border-(length:--border-width) p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">
                  {session.deviceLabel?.trim() || 'Unknown device'}
                </p>
                {session.current ? (
                  <Badge variant="pill" color="green">
                    This device
                  </Badge>
                ) : null}
              </div>
              <p className="text-foreground/70 text-sm">
                Signed in {formatWhen(session.createdAt)}
                {session.lastUsedAt
                  ? ` · Last active ${formatWhen(session.lastUsedAt)}`
                  : ''}
              </p>
            </div>
            {!session.current ? (
              <Button
                size="sm"
                variant="text"
                disabled={busy}
                onClick={() => setPending(session)}
              >
                Sign out
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={Boolean(pending)}
        onCancel={() => setPending(null)}
        title="Sign out this device?"
        description="That session will need to sign in again."
        confirmLabel="Sign out"
        onConfirm={() => {
          if (!pending || busy) {
            return;
          }
          setBusy(true);
          void revokeDeviceSession(pending.id)
            .then(() => {
              setSessions((rows) => rows.filter((s) => s.id !== pending.id));
              setPending(null);
              toast.success('Device signed out');
            })
            .catch((err) => {
              toast.error(
                err instanceof Error ? err.message : 'Could not sign out',
              );
            })
            .finally(() => setBusy(false));
        }}
      />

      <ConfirmDialog
        isOpen={signOutAll}
        onCancel={() => setSignOutAll(false)}
        title="Sign out everywhere?"
        description="Every device, including this one, will need to sign in again."
        confirmLabel="Sign out everywhere"
        onConfirm={() => {
          if (busy) {
            return;
          }
          setBusy(true);
          void revokeAllDeviceSessions()
            .then(() => {
              setSignOutAll(false);
              toast.success('Signed out everywhere');
              window.location.assign('/');
            })
            .catch((err) => {
              toast.error(
                err instanceof Error ? err.message : 'Could not sign out',
              );
            })
            .finally(() => setBusy(false));
        }}
      />
    </div>
  );
}
