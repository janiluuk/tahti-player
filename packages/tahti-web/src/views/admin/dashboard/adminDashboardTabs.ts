export type AdminDashboardTab = 'health' | 'jobs' | 'monitoring' | 'activity';

export const ADMIN_DASHBOARD_TABS: AdminDashboardTab[] = [
  'health',
  'jobs',
  'monitoring',
  'activity',
];

export function parseAdminDashboardTab(
  value: unknown,
): AdminDashboardTab | undefined {
  return value !== 'health' &&
    ADMIN_DASHBOARD_TABS.includes(value as AdminDashboardTab)
    ? (value as AdminDashboardTab)
    : undefined;
}

/** Sections that lived on the single Health page keep their `#hash` deep
 * links (`/admin#monitoring`, `/admin#queues`) by opening the tab that now
 * holds them. */
const SECTION_TABS: Record<string, AdminDashboardTab> = {
  'status-checks': 'health',
  'live-now': 'health',
  'queue-health': 'jobs',
  'cron-jobs': 'jobs',
  queues: 'jobs',
  workers: 'jobs',
  monitoring: 'monitoring',
  'needs-action': 'activity',
};

export function adminDashboardTabForHash(
  hash: string,
): AdminDashboardTab | undefined {
  return SECTION_TABS[hash.replace(/^#/, '')];
}
