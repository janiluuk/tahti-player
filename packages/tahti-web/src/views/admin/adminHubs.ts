export type AdminHubId = 'content' | 'coop' | 'platform';

export const ADMIN_HUB_IDS: readonly AdminHubId[] = [
  'content',
  'coop',
  'platform',
];

export function isAdminHubId(value: unknown): value is AdminHubId {
  return ADMIN_HUB_IDS.includes(value as AdminHubId);
}
