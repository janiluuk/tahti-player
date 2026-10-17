import { AlertCircleIcon } from 'lucide-react';

import { Button, EmptyState } from '@tahti-player/ui';

import { logClientEvent } from '../lib/clientLogs';

export function AppErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset?: () => void;
}) {
  logClientEvent('error', 'app', error.message || 'Unhandled render error');

  return (
    <div className="bg-background text-foreground flex min-h-[50vh] items-center justify-center p-6">
      <EmptyState
        icon={<AlertCircleIcon aria-hidden />}
        title="Something went wrong"
        description="This page hit an unexpected error. Try again, or go back to Listen."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {reset ? (
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.assign('/');
              }}
            >
              Back to Listen
            </Button>
          </div>
        }
      />
    </div>
  );
}
