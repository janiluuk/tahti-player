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
} from '../../stores/settingsModalStore';
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

function isAccountSettingsSection(
  value: string | null,
): value is AccountSettingsSection {
  return value === 'subscriptions' || value === 'api-tokens';
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
  const sectionId = rawSectionId === 'language' ? 'playback' : rawSectionId;
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
    open(
      section,
      isPluginCategoryTarget(category)
        ? category
        : category
          ? pluginAudienceForTarget(category)
          : undefined,
      section === 'artist' && isArtistSettingsSection(tab) ? tab : undefined,
      section === 'account' && isAccountSettingsSection(tab) ? tab : undefined,
      section === 'playback'
        ? rawSectionId === 'language' || tab === 'language'
          ? 'language'
          : 'playback'
        : undefined,
    );
    if (!isSettingsSectionId(sectionId)) {
      useSettingsModalStore.setState({ openedToSection: false });
    }
  }, [hasChannel, navigate, open, pathname, searchStr, section, sectionId]);

  return null;
}
