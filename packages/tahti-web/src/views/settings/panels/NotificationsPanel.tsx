import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { InlineLoader, SectionTitle } from '@tahti-player/ui';

import {
  fetchNotificationPrefs,
  patchNotificationPrefs,
  type NotificationPrefs,
} from '../../../api/artist-settings';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../../api/studio-extras';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { SettingsToggle } from '../SettingsFields';
import { CommentSettingsToggles } from './CommentSettingsToggles';
import { GrantReportAttributionToggle } from './GrantReportAttributionToggle';
import { TopListsToggle } from './TopListsToggle';

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
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [savingKey, setSavingKey] = useState<keyof ProfileFields | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileAttempt, setProfileAttempt] = useState(0);

  useEffect(() => {
    void fetchMeProfile().then((result) => {
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      setProfileError(reason);
      setProfile(reason ? null : result.data);
    });
  }, [profileAttempt]);

  const updateVisibility = (
    key:
      | 'showJoinDate'
      | 'showFollowers'
      | 'showFollowing'
      | 'showLikes'
      | 'showDailyListeners'
      | 'showPlaysTotal'
      | 'showPlaysToday'
      | 'showPlaysYesterday'
      | 'showDownloads',
    value: boolean,
  ) => {
    if (!profile) {
      return;
    }
    const previous = profile[key] ?? true;
    setProfile({ ...profile, [key]: value });
    setSavingKey(key);
    void patchMeProfile({ [key]: value }).then((result) => {
      setSavingKey(null);
      if (!result.ok) {
        setProfile({ ...profile, [key]: previous });
        toast.error(result.error);
        return;
      }
      setProfile(result.data);
      toast.success(t('settingsBody.account.visibilitySaved'));
    });
  };

  const updateConnectionsVisibility = (value: boolean) => {
    if (!profile) {
      return;
    }
    const previous = profile.socialLinks;
    setProfile({
      ...profile,
      socialLinks: { ...(previous ?? {}), showConnections: String(value) },
    });
    setSavingKey('socialLinks');
    void patchMeProfile({
      socialLinks: { ...(previous ?? {}), showConnections: String(value) },
    }).then((result) => {
      setSavingKey(null);
      if (!result.ok) {
        setProfile({ ...profile, socialLinks: previous });
        toast.error(result.error);
        return;
      }
      setProfile(result.data);
      toast.success(t('settingsBody.account.visibilitySaved'));
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle
          title={t('settingsBody.account.visibilityTitle')}
          wrap
          className="font-display tracking-tight"
        />
        <p className="text-foreground-secondary mt-1 text-sm">
          {t('settingsBody.account.visibilityDescription')}
        </p>
      </div>
      {!profile && profileError ? (
        <PageError
          title={t('settingsBody.account.visibilityLoadError')}
          description={profileError}
          onRetry={() => {
            setProfileError(null);
            setProfileAttempt((n) => n + 1);
          }}
        />
      ) : !profile ? (
        <InlineLoader label={t('settingsBody.loading')} />
      ) : (
        <div className="flex flex-col gap-4">
          <StudioPanel
            title={t('settingsBody.account.visibilityProfileTitle')}
            description={t('settingsBody.account.visibilityProfileDescription')}
          >
            <div className="flex flex-col gap-5">
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowJoinDate')}
                value={profile.showJoinDate ?? true}
                onChange={(value) => updateVisibility('showJoinDate', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowFollowers')}
                value={profile.showFollowers ?? true}
                onChange={(value) => updateVisibility('showFollowers', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowFollowing')}
                value={profile.showFollowing ?? false}
                onChange={(value) => updateVisibility('showFollowing', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowPlaysTotal')}
                value={profile.showPlaysTotal ?? true}
                onChange={(value) => updateVisibility('showPlaysTotal', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowPlaysToday')}
                value={profile.showPlaysToday ?? false}
                onChange={(value) => updateVisibility('showPlaysToday', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowPlaysYesterday')}
                value={profile.showPlaysYesterday ?? false}
                onChange={(value) =>
                  updateVisibility('showPlaysYesterday', value)
                }
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowDownloads')}
                value={profile.showDownloads ?? false}
                onChange={(value) => updateVisibility('showDownloads', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowLikes')}
                value={profile.showLikes ?? true}
                onChange={(value) => updateVisibility('showLikes', value)}
              />
              <SettingsToggle
                label={t('settingsBody.account.visibilityShowConnections')}
                value={profile.socialLinks?.showConnections !== 'false'}
                onChange={updateConnectionsVisibility}
              />
            </div>
          </StudioPanel>
          <StudioPanel
            title={t('settingsBody.account.visibilityUploadsTitle')}
            description={t('settingsBody.account.visibilityUploadsDescription')}
          >
            <div className="flex flex-col gap-5">
              <TopListsToggle />
              <CommentSettingsToggles />
            </div>
          </StudioPanel>
          <StudioPanel title={t('settingsBody.account.visibilityGrantTitle')}>
            <GrantReportAttributionToggle
              profile={profile}
              onSaved={setProfile}
            />
          </StudioPanel>
        </div>
      )}
      <div className="border-border border-t pt-5">
        <SectionTitle
          title={t('settingsBody.account.notificationsSectionTitle')}
          wrap
          className="font-display tracking-tight"
        />
        <p className="text-foreground-secondary mt-1 mb-5 text-sm">
          {t('settingsBody.account.notificationsSectionDescription')}
        </p>
        <NotificationsPanel />
      </div>
      {savingKey ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {t('settingsBody.account.visibilitySaving')}
        </p>
      ) : null}
    </div>
  );
}
