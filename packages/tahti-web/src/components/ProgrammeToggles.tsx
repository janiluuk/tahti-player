import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { InlineLoader } from '@tahti-player/ui';

import {
  fetchProgramme,
  patchProgramme,
  type ProgrammeView,
} from '../api/studio-extras';
import { SettingsToggle } from '../views/settings/SettingsFields';
import { PageError } from './PageStates';

type ProgrammePatch = Partial<
  Pick<
    ProgrammeView,
    'announcementsEnabled' | 'fallbackEnabled' | 'fallbackAutoEnroll'
  >
>;

/** The channel programme switches: announcements in the programme, the
 * offline fallback, and whether new archive items join the fallback. Each
 * switch saves at once and flips back with the API's reason on failure. */
export function ProgrammeToggles() {
  const { t } = useTranslation('web');
  const [programme, setProgramme] = useState<ProgrammeView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchProgramme().then((result) => {
      if (cancelled) {
        return;
      }
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      setError(reason);
      setProgramme(reason ? null : result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const save = (patch: ProgrammePatch) => {
    if (!programme) {
      return;
    }
    const previous = programme;
    setProgramme({ ...previous, ...patch });
    void patchProgramme(patch).then((result) => {
      if (!result.ok) {
        setProgramme(previous);
        toast.error(result.error);
      }
    });
  };

  if (!programme) {
    return error ? (
      <PageError
        title={t('settingsBody.broadcast.radioLoadError')}
        description={error}
        onRetry={() => {
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    ) : (
      <InlineLoader label={t('settingsBody.loading')} />
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="programme-toggles">
      <SettingsToggle
        label={t('settingsBody.broadcast.announcementsLabel')}
        description={t('settingsBody.broadcast.announcementsDescription')}
        value={programme.announcementsEnabled}
        onChange={(v) => save({ announcementsEnabled: v })}
      />
      <SettingsToggle
        label={t('settingsBody.broadcast.fallbackLabel')}
        value={programme.fallbackEnabled}
        onChange={(v) => save({ fallbackEnabled: v })}
      />
      <SettingsToggle
        label={t('settingsBody.broadcast.autoEnrollLabel')}
        value={programme.fallbackAutoEnroll}
        onChange={(v) => save({ fallbackAutoEnroll: v })}
      />
    </div>
  );
}
