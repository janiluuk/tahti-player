import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button } from '@tahti-player/ui';

import {
  fetchDeviceSessions,
  revokeAllDeviceSessions,
  revokeDeviceSession,
  type DeviceSession,
} from '../api/sessions';
import { ConfirmDialog } from './ConfirmDialog';
import { ListingDate } from './ListingDate';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from './PageStates';

export function DevicesSessionsPanel() {
  const { t } = useTranslation('web');
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
          signs you out here. We email you when a device you haven&apos;t used
          before signs in.
        </p>
        <Button
          size="sm"
          intent="danger"
          disabled={busy}
          onClick={() => setSignOutAll(true)}
        >
          {t('authToasts.signOutEverywhere')}
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
              <p className="text-foreground/70 flex flex-wrap items-center gap-x-1 text-sm">
                <span>Signed in</span>
                <ListingDate value={session.createdAt} />
                {session.lastUsedAt ? (
                  <>
                    <span>· Last active</span>
                    <ListingDate value={session.lastUsedAt} />
                  </>
                ) : null}
              </p>
            </div>
            {!session.current ? (
              <Button
                size="sm"
                variant="text"
                disabled={busy}
                onClick={() => setPending(session)}
              >
                {t('authToasts.signOut')}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        destructive
        isOpen={Boolean(pending)}
        onCancel={() => setPending(null)}
        title={t('authToasts.signOutDeviceTitle')}
        description={t('authToasts.signOutDeviceDescription')}
        confirmLabel={t('authToasts.signOut')}
        onConfirm={() => {
          if (!pending || busy) {
            return;
          }
          setBusy(true);
          void revokeDeviceSession(pending.id)
            .then(() => {
              setSessions((rows) => rows.filter((s) => s.id !== pending.id));
              setPending(null);
              toast.success(t('authToasts.deviceSignedOut'));
            })
            .catch((err) => {
              toast.error(
                err instanceof Error
                  ? err.message
                  : t('authToasts.signOutFailed'),
              );
            })
            .finally(() => setBusy(false));
        }}
      />

      <ConfirmDialog
        destructive
        isOpen={signOutAll}
        onCancel={() => setSignOutAll(false)}
        title={t('authToasts.signOutEverywhereTitle')}
        description={t('authToasts.signOutEverywhereDescription')}
        confirmLabel={t('authToasts.signOutEverywhere')}
        onConfirm={() => {
          if (busy) {
            return;
          }
          setBusy(true);
          void revokeAllDeviceSessions()
            .then(() => {
              setSignOutAll(false);
              toast.success(t('authToasts.signedOutEverywhere'));
              window.location.assign('/');
            })
            .catch((err) => {
              toast.error(
                err instanceof Error
                  ? err.message
                  : t('authToasts.signOutFailed'),
              );
            })
            .finally(() => setBusy(false));
        }}
      />
    </div>
  );
}
