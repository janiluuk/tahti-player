import { useShallow } from 'zustand/react/shallow';

import { Button, InlineError, Meter } from '@tahti-player/ui';

import { useDesktopUpdateStore } from '../lib/updates/desktopUpdates';
import { SettingsToggle } from '../views/settings/SettingsFields';

/** Settings → Integrations in the desktop app: the installed version, a manual check and installing a newer release. */
export function DesktopUpdatesRow() {
  const {
    status,
    update,
    progress,
    error,
    checkOnStart,
    setCheckOnStart,
    check,
    install,
    relaunch,
  } = useDesktopUpdateStore(
    useShallow((s) => ({
      status: s.status,
      update: s.update,
      progress: s.progress,
      error: s.error,
      checkOnStart: s.checkOnStart,
      setCheckOnStart: s.setCheckOnStart,
      check: s.check,
      install: s.install,
      relaunch: s.relaunch,
    })),
  );
  const version = __APP_VERSION__.split('+')[0];
  return (
    <div className="flex flex-col gap-3" data-testid="integration-updates">
      <SettingsToggle
        label="Check for updates"
        description={`You have Tahti Player ${version}. When a new release is out, the app offers to install it.`}
        value={checkOnStart}
        onChange={setCheckOnStart}
      />
      <div className="flex flex-wrap items-center gap-3">
        {status === 'available' && update ? (
          <Button size="sm" onClick={() => void install()}>
            Install {update.version}
          </Button>
        ) : status === 'ready' ? (
          <Button size="sm" onClick={() => void relaunch()}>
            Restart to finish
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={status === 'checking' || status === 'installing'}
            onClick={() => void check()}
          >
            Check now
          </Button>
        )}
        <p className="text-foreground-secondary text-sm" role="status">
          {status === 'checking'
            ? 'Checking…'
            : status === 'up-to-date'
              ? 'You have the latest version.'
              : status === 'available' && update
                ? `Tahti Player ${update.version} is available.`
                : status === 'installing'
                  ? `Installing… ${progress}%`
                  : status === 'ready'
                    ? 'Installed. Restart Tahti Player to use it.'
                    : null}
        </p>
      </div>
      {status === 'installing' ? (
        <Meter value={progress} aria-label="Update download" />
      ) : null}
      {status === 'available' && update?.notes ? (
        <p className="text-foreground-secondary text-sm whitespace-pre-wrap">
          {update.notes}
        </p>
      ) : null}
      {error ? <InlineError>Could not update: {error}</InlineError> : null}
    </div>
  );
}
