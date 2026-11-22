export type AdminDashboardTab = 'health' | 'activity';

export const ADMIN_DASHBOARD_TABS: AdminDashboardTab[] = ['health', 'activity'];

export function parseAdminDashboardTab(
  value: unknown,
): AdminDashboardTab | undefined {
  return value === 'activity' ? 'activity' : undefined;
}
