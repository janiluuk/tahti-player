import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import {
  isPluginCategoryTarget,
  pluginAudienceForTarget,
} from '../../content/pluginStoreCategories';
import { movedProfileSettingsPath } from '../../lib/studioProfileSections';
import { useAuthStore } from '../../stores/authStore';
import {
  useSettingsModalStore,
  type AccountSettingsSection,
  type ArtistSettingsSection,
  type NotificationsSettingsSection,
  type SecuritySettingsSection,
} from '../../stores/settingsModalStore';
import {
  isNotificationsTabId,
  isSecurityTabId,
} from './panels/accountTabGroups';
import { isSettingsSectionId, type SettingsSectionId } from './settingsNav';
import { socialCallbackToast } from './socialCallback';

const ARTIST_SECTIONS: readonly ArtistSettingsSection[] = [
  'identity',
  'story',
  'people',
  'connections',
  'branding',
  'gallery',
  'press-kit',
  'release-visuals',
];

function isArtistSettingsSection(
  value: string | null,
): value is ArtistSettingsSection {
  return Boolean(
    value && ARTIST_SECTIONS.includes(value as ArtistSettingsSection),
  );
}

const ACCOUNT_SECTIONS: readonly AccountSettingsSection[] = [
  'session',
  'membership',
  'governance',
  'storage',
  'subscriptions',
  'purchases',
  'privacy',
];

function isAccountSettingsSection(
  value: string | null,
): value is AccountSettingsSection {
  return Boolean(
    value && ACCOUNT_SECTIONS.includes(value as AccountSettingsSection),
  );
}

function isSecuritySettingsSection(
  value: string | null,
): value is SecuritySettingsSection {
  return isSecurityTabId(value);
}

function isNotificationsSettingsSection(
  value: string | null,
): value is NotificationsSettingsSection {
  return isNotificationsTabId(value);
}

function showCallbackToast(
  params: URLSearchParams,
  status: string | null,
  social: string | null,
  category: string | null,
) {
  const providerLabel = (() => {
    const categoryLabel = (
      params.get('provider') ??
      category ??
      ''
    ).toLowerCase();
    if (categoryLabel.includes('soundcloud')) {
      return 'SoundCloud';
    }
    if (categoryLabel.includes('bandcamp')) {
      return 'Bandcamp';
    }
    if (categoryLabel.includes('mixcloud')) {
      return 'Mixcloud';
    }
    if (categoryLabel.includes('spotify')) {
      return 'Spotify';
    }
    if (categoryLabel.includes('google-drive')) {
      return 'Google Drive';
    }
    if (categoryLabel.includes('hearthis')) {
      return 'hearthis.at';
    }
    return null;
  })();
  if (status === 'connected') {
    toast.success(
      providerLabel
        ? i18n.t('web:authToasts.connected', { provider: providerLabel })
        : i18n.t('web:authToasts.connectedGeneric'),
    );
  } else if (status === 'login') {
    toast.info(i18n.t('web:authToasts.signInFirst'));
  } else if (status) {
    toast.error(
      providerLabel
        ? i18n.t('web:authToasts.connectFailed', { provider: providerLabel })
        : i18n.t('web:authToasts.connectFailedGeneric'),
    );
  }
  const socialToast = socialCallbackToast(social);
  if (socialToast) {
    toast[socialToast.kind](socialToast.message);
  }
}

/** Deep link `/settings` → Nuclear SettingsPanel modal. Also the landing
 * pad for OAuth connect callbacks (see cutoverReturns.ts) - `?status=` and
 * `?social=` are surfaced as a toast, same as the retired Sources page did. */
export function SettingsView() {
  const open = useSettingsModalStore((s) => s.open);
  const navigate = useNavigate();
  const hasChannel = useAuthStore((s) => Boolean(s.user?.channel));
  const searchStr = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const toastedCallbackRef = useRef<string | null>(null);
  const rawSectionId = pathname.match(/^\/settings\/([^/]+)/)?.[1];
  const sectionId =
    rawSectionId === 'language' || rawSectionId === 'integrations'
      ? 'playback'
      : rawSectionId;
  const section: SettingsSectionId = isSettingsSectionId(sectionId)
    ? sectionId
    : 'account';

  useEffect(() => {
    // Close sets dismissRouteOpen so this route effect cannot fight Esc/X and
    // re-open the modal before navigation leaves /settings (seen on Firefox).
    // While a close navigates away, the router already reports the new
    // location but still renders this route for a moment; opening then would
    // send the user straight back to /settings.
    if (
      useSettingsModalStore.getState().dismissRouteOpen ||
      !pathname.startsWith('/settings')
    ) {
      return;
    }
    const params = new URLSearchParams(
      searchStr.startsWith('?') ? searchStr.slice(1) : searchStr,
    );
    const category = params.get('category');
    const tab = params.get('tab');
    const status = params.get('status');
    const social = params.get('social');
    const callbackKey = `${status ?? ''}|${social ?? ''}|${category ?? ''}`;
    if ((status || social) && toastedCallbackRef.current !== callbackKey) {
      toastedCallbackRef.current = callbackKey;
      showCallbackToast(params, status, social, category);
    }
    // An artist's profile forms live in Studio → Profile and Following is a
    // Library tab; Settings → Artist is the listener's profile.
    if (section === 'artist' && (hasChannel || tab === 'following')) {
      useSettingsModalStore.getState().close();
      void navigate({
        href: movedProfileSettingsPath('artist', tab),
        replace: true,
      });
      return;
    }
    // Themes have one browser, Settings → Themes; an old Add-ons → Themes
    // link opens it.
    if (section === 'plugin-store' && category === 'themes') {
      open('themes');
      return;
    }
    // Security and Notifications left Account; old ?tab= bookmarks follow.
    if (section === 'account' && isSecurityTabId(tab)) {
      void navigate({
        href: `/settings/security?tab=${tab}`,
        replace: true,
      });
      return;
    }
    if (section === 'account' && isNotificationsTabId(tab)) {
      void navigate({
        href:
          tab === 'notifications'
            ? '/settings/notifications'
            : `/settings/notifications?tab=${tab}`,
        replace: true,
      });
      return;
    }
    const pluginCategory = isPluginCategoryTarget(category)
      ? category
      : category
        ? pluginAudienceForTarget(category)
        : undefined;
    const playbackSection =
      section === 'playback'
        ? rawSectionId === 'language' || tab === 'language'
          ? 'language'
          : rawSectionId === 'integrations' || tab === 'integrations'
            ? 'integrations'
            : 'playback'
        : undefined;
    open(
      section,
      pluginCategory,
      section === 'artist' && isArtistSettingsSection(tab) ? tab : undefined,
      section === 'account' && isAccountSettingsSection(tab) ? tab : undefined,
      playbackSection,
      section === 'security' && isSecuritySettingsSection(tab)
        ? tab
        : section === 'security'
          ? 'password-email'
          : undefined,
      section === 'notifications' && isNotificationsSettingsSection(tab)
        ? tab
        : section === 'notifications'
          ? 'notifications'
          : undefined,
    );
    if (!isSettingsSectionId(sectionId)) {
      useSettingsModalStore.setState({ openedToSection: false });
    }
  }, [hasChannel, navigate, open, pathname, searchStr, section, sectionId]);

  return null;
}
