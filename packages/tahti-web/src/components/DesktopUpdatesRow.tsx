import { useShallow } from 'zustand/react/shallow';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Meter } from '@tahti-player/ui';

import { useDesktopUpdateStore } from '../lib/updates/desktopUpdates';
import { SettingsToggle } from '../views/settings/SettingsFields';

/** Settings → Integrations in the desktop app: the installed version, a manual check and installing a newer release. */
export function DesktopUpdatesRow() {
  const { t } = useTranslation('web');
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
        label={t('desktopUpdatesRow.checkForUpdates')}
        description={t('desktopUpdatesRowLabels.youHaveTahtiPlayerVersion', {
          version,
        })}
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
            {t('desktopUpdatesRow.restartToFinish')}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={status === 'checking' || status === 'installing'}
            onClick={() => void check()}
          >
            {t('desktopUpdatesRow.checkNow')}
          </Button>
        )}
        <p className="text-foreground-secondary text-sm" role="status">
          {status === 'checking'
            ? 'Checking…'
            : status === 'up-to-date'
              ? i18n.t('web:batch51.latestVersion')
              : status === 'available' && update
                ? `Tahti Player ${update.version} is available.`
                : status === 'installing'
                  ? `Installing… ${progress}%`
                  : status === 'ready'
                    ? i18n.t('web:batch51.restartToUse')
                    : null}
        </p>
      </div>
      {status === 'installing' ? (
        <Meter
          value={progress}
          aria-label={t('desktopUpdatesRow.updateDownload')}
        />
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
