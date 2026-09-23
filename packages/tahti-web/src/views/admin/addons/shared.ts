import {
  type AdminAddon,
  type AdminAddonRegisterInput,
  type AdminAddonScope,
} from '../../../api/admin';

// Labels spell out the listener-facing category each scope corresponds to
// (see PluginCategoryId in content/pluginStoreCategories.ts) -- this page
// covers exactly the `discovery` and `channel` plugin categories via the
// same Addon/AddonInstall backend, just discriminated by install target
// (listenerUserId / channelId / adminSurface). ADMIN-scope addons are
// installed onto a shared surface (e.g. the homepage) via the "Admin
// surface installs" panel below, rather than the enabled-by-default /
// scoped-install pattern the other two use.
export const SCOPES: Array<{ id: AdminAddonScope; label: string }> = [
  { id: 'LISTENER', label: 'Listener (Discovery)' },
  { id: 'ARTIST', label: 'Artist (Channel)' },
  { id: 'ADMIN', label: 'Admin surface' },
];

export const EMPTY_DRAFT: AdminAddonRegisterInput = {
  slug: '',
  scope: 'ARTIST',
  name: '',
  description: '',
  authorName: '',
  categories: [],
  iconUrl: '',
};

export function statusColor(status: AdminAddon['status']) {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'PENDING':
      return 'purple';
    case 'REJECTED':
      return 'red';
    case 'DISABLED':
      return 'orange';
    default:
      return 'blue';
  }
}
