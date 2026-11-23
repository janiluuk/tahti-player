import { describe, expect, it } from 'vitest';

import {
  adminDashboardTabForHash,
  parseAdminDashboardTab,
} from './adminDashboardTabs';

describe('parseAdminDashboardTab', () => {
  it('keeps the known non-default tabs and drops the rest', () => {
    expect(parseAdminDashboardTab('jobs')).toBe('jobs');
    expect(parseAdminDashboardTab('monitoring')).toBe('monitoring');
    expect(parseAdminDashboardTab('activity')).toBe('activity');
    expect(parseAdminDashboardTab('health')).toBeUndefined();
    expect(parseAdminDashboardTab('nope')).toBeUndefined();
    expect(parseAdminDashboardTab(undefined)).toBeUndefined();
  });
});

describe('adminDashboardTabForHash', () => {
  it('opens the tab that holds an old section link', () => {
    expect(adminDashboardTabForHash('#monitoring')).toBe('monitoring');
    expect(adminDashboardTabForHash('queues')).toBe('jobs');
    expect(adminDashboardTabForHash('#workers')).toBe('jobs');
    expect(adminDashboardTabForHash('#status-checks')).toBe('health');
    expect(adminDashboardTabForHash('')).toBeUndefined();
    expect(adminDashboardTabForHash('#elsewhere')).toBeUndefined();
  });
});
