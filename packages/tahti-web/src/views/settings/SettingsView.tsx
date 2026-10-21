import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { pluginAudienceForTarget } from '../../content/pluginStoreCategories';
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

/** Deep link `/settings` → Nuclear SettingsPanel modal. Also the landing
 * pad for OAuth connect callbacks (see cutoverReturns.ts) - `?status=` and
 * `?social=` are surfaced as a toast, same as the retired Sources page did. */
export function SettingsView({ sectionId }: { sectionId?: string }) {
  const open = useSettingsModalStore((s) => s.open);
  const searchStr = useRouterState({
    select: (state) => state.location.searchStr,
  });
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const toastedCallbackRef = useRef<string | null>(null);
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
    open(
      section,
      category ? pluginAudienceForTarget(category) : undefined,
      section === 'artist' && isArtistSettingsSection(tab) ? tab : undefined,
      section === 'account' && isAccountSettingsSection(tab) ? tab : undefined,
    );
    if (!isSettingsSectionId(sectionId)) {
      useSettingsModalStore.setState({ openedToSection: false });
    }
    const status = params.get('status');
    const social = params.get('social');
    if (!status && !social) {
      return;
    }
    const callbackKey = `${status ?? ''}|${social ?? ''}|${category ?? ''}`;
    if (toastedCallbackRef.current === callbackKey) {
      return;
    }
    toastedCallbackRef.current = callbackKey;
    const providerLabel = (() => {
      const categoryLabel = category?.toLowerCase() ?? '';
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
      if (categoryLabel.includes('hearthis')) {
        return 'hearthis.at';
      }
      return null;
    })();
    if (status === 'connected') {
      toast.success(
        providerLabel ? `${providerLabel} connected.` : 'Connected.',
      );
    } else if (status === 'login') {
      toast.info('Sign in to Tahti first, then connect.');
    } else if (status) {
      toast.error(
        providerLabel
          ? `Could not connect ${providerLabel}. Try again.`
          : 'Could not connect. Try again.',
      );
    }
    const socialToast = socialCallbackToast(social);
    if (socialToast) {
      toast[socialToast.kind](socialToast.message);
    }
  }, [open, pathname, searchStr, section, sectionId]);

  return null;
}
