import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  fetchDiscoveryPrefs,
  fetchNotificationPrefs,
  patchDiscoveryPrefs,
  patchNotificationPrefs,
  type DiscoveryPrefs,
  type NotificationPrefs,
} from '../../../api/artist-settings';
import {
  fetchMeProfile,
  patchMeProfile,
  type ProfileFields,
} from '../../../api/studio-extras';
import { SettingsHint, SettingsToggle } from '../SettingsFields';

export function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    void fetchNotificationPrefs().then((r) => setPrefs(r.data));
  }, []);

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
    toast.success('Notification preference saved.');
  };

  if (!prefs) {
    return <SettingsHint>Loading…</SettingsHint>;
  }

  const toggle = (key: keyof NotificationPrefs, value: boolean) => {
    void set(key, value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Money moves</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          When fan subscriptions arrive or payouts complete.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <SettingsToggle
            label="Email me"
            value={prefs.notifyMoneyMovesEmail}
            onChange={(value) => toggle('notifyMoneyMovesEmail', value)}
          />
          <SettingsToggle
            label="In-app"
            value={prefs.notifyMoneyMovesInApp}
            onChange={(value) => toggle('notifyMoneyMovesInApp', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · @aurora_fi subscribed (€5/mo)
        </p>
      </div>
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Listener actions</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          A daily email digest of new chat messages, comments, and broadcast
          feedback.
        </p>
        <div className="mt-4">
          <SettingsToggle
            label="Email digest, daily"
            value={prefs.notifyListenerActivityEmail}
            onChange={(value) => toggle('notifyListenerActivityEmail', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · 3 new chat messages, 1 new comment on Drift EP
        </p>
      </div>
      <div className="border-border bg-background-secondary/30 rounded-xl border p-4">
        <h3 className="font-display text-base font-bold">Weekly recap</h3>
        <p className="text-foreground-secondary mt-1 text-sm">
          A Sunday summary of your activity and audience.
        </p>
        <div className="mt-4">
          <SettingsToggle
            label="Email me"
            value={prefs.notifyWeeklyRecapEmail}
            onChange={(value) => toggle('notifyWeeklyRecapEmail', value)}
          />
        </div>
        <p className="border-border bg-background mt-4 rounded-lg border px-3 py-2 text-xs">
          Tahti · 1,247 plays · 89 downloads · €115 this week
        </p>
      </div>
    </div>
  );
}

export function NotificationsVisibilityPanel() {
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryPrefs | null>(null);
  const [savingKey, setSavingKey] = useState<keyof ProfileFields | null>(null);
  const [savingDiscovery, setSavingDiscovery] = useState(false);

  useEffect(() => {
    void Promise.all([fetchMeProfile(), fetchDiscoveryPrefs()]).then(
      ([profileResult, discoveryResult]) => {
        setProfile(profileResult.data);
        setDiscovery(discoveryResult.data);
      },
    );
  }, []);

  const updateVisibility = (
    key:
      | 'showJoinDate'
      | 'showFollowers'
      | 'showFollowing'
      | 'showDailyListeners',
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
      toast.success('Visibility setting saved.');
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
    setSavingKey('chatEnabled');
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
      toast.success('Visibility setting saved.');
    });
  };

  const updateDiscovery = (
    key: keyof Pick<DiscoveryPrefs, 'showFavorites' | 'announceReleases'>,
    value: boolean,
  ) => {
    if (!discovery) {
      return;
    }
    setDiscovery({ ...discovery, [key]: value });
    setSavingDiscovery(true);
    void patchDiscoveryPrefs({ [key]: value }).then((result) => {
      setSavingDiscovery(false);
      if (!result.ok) {
        setDiscovery(discovery);
        toast.error(result.error);
        return;
      }
      setDiscovery(result.data);
      toast.success('Notification setting saved.');
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Visibility
        </h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Choose what appears publicly on your profile and channel.
        </p>
      </div>
      {!profile || !discovery ? (
        <SettingsHint>Loading…</SettingsHint>
      ) : (
        <div className="flex flex-col gap-5">
          <SettingsToggle
            label="Show join date on my profile"
            value={profile.showJoinDate ?? true}
            onChange={(value) => updateVisibility('showJoinDate', value)}
          />
          <SettingsToggle
            label="Show my followers on my profile"
            value={profile.showFollowers ?? true}
            onChange={(value) => updateVisibility('showFollowers', value)}
          />
          <SettingsToggle
            label="Show who I follow on my profile"
            value={profile.showFollowing ?? true}
            onChange={(value) => updateVisibility('showFollowing', value)}
          />
          <SettingsToggle
            label="Show today’s listener count in my chat"
            value={profile.showDailyListeners ?? true}
            onChange={(value) => updateVisibility('showDailyListeners', value)}
          />
          <SettingsToggle
            label="Show my connections on my artist profile"
            value={profile.socialLinks?.showConnections !== 'false'}
            onChange={updateConnectionsVisibility}
          />
          <SettingsToggle
            label="Show favourites"
            description="Your favourited tracks and channels are visible on your public profile."
            value={discovery.showFavorites}
            onChange={(value) => updateDiscovery('showFavorites', value)}
          />
        </div>
      )}
      <div className="border-border border-t pt-5">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Notifications
        </h2>
        <p className="text-foreground-secondary mt-1 mb-5 text-sm">
          Choose which activity reaches you by email or in the app.
        </p>
        <NotificationsPanel />
        {discovery ? (
          <SettingsToggle
            label="Announce releases"
            description="Followers get a notification (and optional email) when you publish a release."
            value={discovery.announceReleases}
            onChange={(value) => updateDiscovery('announceReleases', value)}
          />
        ) : null}
      </div>
      {savingKey || savingDiscovery ? (
        <p className="text-foreground-secondary text-xs" role="status">
          Saving visibility…
        </p>
      ) : null}
    </div>
  );
}
