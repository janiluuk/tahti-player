import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { InlineLoader } from '@tahti-player/ui';

import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../api/studio-extras';
import { CommentSettingsToggles } from '../views/settings/panels/CommentSettingsToggles';
import { GrantReportAttributionToggle } from '../views/settings/panels/GrantReportAttributionToggle';
import { TopListsToggle } from '../views/settings/panels/TopListsToggle';
import { SettingsToggle } from '../views/settings/SettingsFields';
import { PageError } from './PageStates';
import { StudioPanel } from './StudioPanel';

/** What visitors see on your profile and uploads: counts, connections,
 * top lists, comments and grant-report attribution. Each toggle saves on its
 * own. Lives in Studio → Profile → Channel page → Visibility. */
export function ProfileVisibilitySection() {
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
            help={t('settingsBody.account.visibilityProfileDescription')}
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
            help={t('settingsBody.account.visibilityUploadsDescription')}
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
      {savingKey ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {t('settingsBody.account.visibilitySaving')}
        </p>
      ) : null}
    </div>
  );
}
