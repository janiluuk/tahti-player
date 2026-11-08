import { AlertCircleIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, EmptyState } from '@tahti-player/ui';

import { logClientEvent } from '../lib/clientLogs';

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function AppErrorFallback({
  error,
  reset,
}: {
  error: unknown;
  reset?: () => void;
}) {
  const { t } = useTranslation('web');
  const err = asError(error);
  logClientEvent('error', 'app', err.message || 'Unhandled render error');

  return (
    <div className="bg-background text-foreground flex min-h-[50vh] items-center justify-center p-6">
      <EmptyState
        icon={<AlertCircleIcon aria-hidden />}
        title={t('appErrorFallback.somethingWentWrong')}
        description={t('appErrorFallback.thisPageHitAnUnexpected')}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {reset ? (
              <Button type="button" onClick={reset}>
                {t('appErrorFallback.tryAgain')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.assign('/');
              }}
            >
              {t('appErrorFallback.backToListen')}
            </Button>
          </div>
        }
      />
    </div>
  );
}
