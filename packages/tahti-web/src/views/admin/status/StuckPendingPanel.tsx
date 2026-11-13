import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError } from '@tahti-player/ui';

import {
  fetchAdminStuckPending,
  requeueAdminStuckPending,
  type AdminStuckPendingSound,
} from '../../../api/admin/admin-queue-jobs';
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

export function StuckPendingPanel() {
  const { t } = useTranslation('web');
  const [sounds, setSounds] = useState<AdminStuckPendingSound[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminStuckPending().then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.data) {
        setSounds(null);
        setError(result.meta.reason ?? t('adminQueues.stuckLoadError'));
        return;
      }
      setError(null);
      setSounds(result.data.sounds);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, t]);

  const refresh = () => setAttempt((n) => n + 1);

  const requeue = async (input: { soundId?: string; all?: boolean }) => {
    setActionError(null);
    setBusy(true);
    const result = await requeueAdminStuckPending(input);
    setBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    refresh();
  };

  return (
    <div data-testid="admin-queues-stuck">
      <StudioPanel title={t('adminQueues.stuckTitle')}>
        {loading ? <PageLoading label={t('settingsBody.loading')} /> : null}
        {error ? (
          <div className="flex flex-col gap-2">
            <InlineError>{error}</InlineError>
            <Button size="sm" variant="secondary" onClick={refresh}>
              {t('actions.tryAgain')}
            </Button>
          </div>
        ) : null}
        {actionError ? <InlineError>{actionError}</InlineError> : null}
        {!loading && !error && sounds ? (
          <>
            <p className="text-foreground-secondary text-xs">
              {t('adminQueues.stuckHint')}
            </p>
            {sounds.length === 0 ? (
              <p className="text-foreground-secondary mt-2 text-sm">
                {t('adminQueues.stuckEmpty')}
              </p>
            ) : (
              <>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void requeue({ all: true })}
                  >
                    {t('adminQueues.requeueAll', { count: sounds.length })}
                  </Button>
                </div>
                <ul className="divide-border mt-2 divide-y">
                  {sounds.map((sound) => (
                    <li
                      key={sound.id}
                      className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{sound.title}</p>
                        <p className="text-foreground-secondary truncate text-xs">
                          {sound.status}
                          {sound.ownerUsername
                            ? ` · ${sound.ownerUsername}`
                            : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busy}
                        onClick={() => void requeue({ soundId: sound.id })}
                      >
                        {t('adminQueues.requeue')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : null}
      </StudioPanel>
    </div>
  );
}
