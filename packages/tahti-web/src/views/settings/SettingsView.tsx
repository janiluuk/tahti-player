import { useEffect } from 'react';
import { toast } from 'sonner';

import type { PluginCategoryId } from '../../content/pluginStoreCategories';
import {
  useSettingsModalStore,
  type ArtistSettingsSection,
} from '../../stores/settingsModalStore';
import { isSettingsSectionId, type SettingsSectionId } from './settingsNav';

const ARTIST_SECTIONS: readonly ArtistSettingsSection[] = [
  'identity',
  'story',
  'people',
  'connections',
  'branding',
  'gallery',
  'press-kit',
  'channel-designer',
  'release-visuals',
];

function isArtistSettingsSection(
  value: string | null,
): value is ArtistSettingsSection {
  return Boolean(
    value && ARTIST_SECTIONS.includes(value as ArtistSettingsSection),
  );
}

/** Deep link `/settings` → Nuclear SettingsPanel modal. Also the landing
 * pad for OAuth connect callbacks (see cutoverReturns.ts) — `?status=` is
 * surfaced as a toast, then dropped, same as the retired Sources page did. */
export function SettingsView({ sectionId }: { sectionId?: string }) {
  const open = useSettingsModalStore((s) => s.open);
  const section: SettingsSectionId = isSettingsSectionId(sectionId)
    ? sectionId
    : 'account';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') as PluginCategoryId | null;
    const artistTab = params.get('tab');
    open(
      section,
      category ?? undefined,
      section === 'artist' && isArtistSettingsSection(artistTab)
        ? artistTab
        : undefined,
    );
    const status = params.get('status');
    if (status === 'connected') {
      toast.success('Connected.');
    } else if (status === 'login') {
      toast.info('Sign in to Tahti first, then connect.');
    } else if (status) {
      toast.error('Could not connect. Try again.');
    }
  }, [open, section]);

  return null;
}
