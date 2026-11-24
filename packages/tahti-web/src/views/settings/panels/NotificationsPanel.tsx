import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { InlineLoader, SectionTitle } from '@tahti-player/ui';

import {
  fetchNotificationPrefs,
  patchNotificationPrefs,
  type NotificationPrefs,
} from '../../../api/artist-settings';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { SettingsToggle } from '../SettingsFields';

export function NotificationsPanel() {
  const { t } = useTranslation('web');
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    void fetchNotificationPrefs().then((r) => {
      const reason = r.meta.source === 'api' ? (r.meta.reason ?? null) : null;
      setLoadError(reason);
      setPrefs(reason ? null : r.data);
    });
  }, [attempt]);

  const set = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) {
      return;
    }
    const previous = prefs[key];
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const result = await patchNotificationPrefs({ [key]: value });
    if (!result.ok) {
      setPrefs({ ...next, [key]: previous });
      toast.error(result.error);
      return;
    }
    setPrefs(result.data);
    toast.success(t('settingsBody.account.notifyPrefsSaved'));
  };

  if (!prefs && loadError) {
    return (
      <PageError
        title={t('settingsBody.account.notifyPrefsLoadError')}
        description={loadError}
        onRetry={() => {
          setLoadError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (!prefs) {
    return <InlineLoader label={t('settingsBody.loading')} />;
  }

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    void set(key, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <StudioPanel
        title={t('settingsBody.account.notifyRevenueTitle')}
        description={t('settingsBody.account.notifyRevenueDescription')}
      >
        <div className="flex flex-col gap-3">
          <SettingsToggle
            label={t('settingsBody.account.notifyEmailMe')}
            value={prefs.notifyMoneyMovesEmail}
            onChange={(value) => toggle('notifyMoneyMovesEmail', value)}
          />
          <SettingsToggle
            label={t('settingsBody.account.notifyInApp')}
            value={prefs.notifyMoneyMovesInApp}
            onChange={(value) => toggle('notifyMoneyMovesInApp', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          {t('settingsBody.account.notifySampleRevenue')}
        </p>
      </StudioPanel>
      {prefs.notifyStudioJobsInApp === undefined ? null : (
        <StudioPanel
          title={t('settingsBody.account.notifyStudioTitle')}
          description={t('settingsBody.account.notifyStudioDescription')}
        >
          <SettingsToggle
            label={t('settingsBody.account.notifyInApp')}
            value={prefs.notifyStudioJobsInApp}
            onChange={(value) => toggle('notifyStudioJobsInApp', value)}
          />
          <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
            {t('settingsBody.account.notifySampleStudio')}
          </p>
        </StudioPanel>
      )}
      <StudioPanel
        title={t('settingsBody.account.notifyListenerTitle')}
        description={t('settingsBody.account.notifyListenerDescription')}
      >
        <SettingsToggle
          label={t('settingsBody.account.notifyListenerEmail')}
          value={prefs.notifyListenerActivityEmail}
          onChange={(value) => toggle('notifyListenerActivityEmail', value)}
        />
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          {t('settingsBody.account.notifySampleListener')}
        </p>
      </StudioPanel>
      <StudioPanel
        title={t('settingsBody.account.notifyWeeklyTitle')}
        description={t('settingsBody.account.notifyWeeklyDescription')}
      >
        <SettingsToggle
          label={t('settingsBody.account.notifyEmailMe')}
          value={prefs.notifyWeeklyRecapEmail}
          onChange={(value) => toggle('notifyWeeklyRecapEmail', value)}
        />
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          {t('settingsBody.account.notifySampleWeekly')}
        </p>
      </StudioPanel>
    </div>
  );
}

export function NotificationsVisibilityPanel() {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle
          title={t('settingsBody.account.notificationsSectionTitle')}
          wrap
          className="font-display tracking-tight"
        />
        <p className="text-foreground-secondary mt-1 text-sm">
          {t('settingsBody.account.notificationsSectionDescription')}
        </p>
      </div>
      <NotificationsPanel />
    </div>
  );
}
