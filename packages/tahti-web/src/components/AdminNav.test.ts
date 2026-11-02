import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ADMIN_SECTIONS,
  ADMIN_TAB_ONLY_ROUTES,
  adminHubItems,
  adminSectionForPath,
  isAdminNavItemActive,
  PRIMARY,
} from './AdminNav';

describe('AdminNav section coverage', () => {
  it('buckets every primary admin page into exactly one section', () => {
    // A page present in PRIMARY (nav row, icon, tour step) but missing from
    // every ADMIN_SECTIONS bucket silently falls back to the "Overview"
    // section: the tab bar highlights the wrong tab and the page's own link
    // never appears in the sidebar. This guards against that drifting again
    // as pages are added, renamed, or retired.
    for (const item of PRIMARY) {
      const owningSections = ADMIN_SECTIONS.filter((section) =>
        section.items.some((sectionItem) => sectionItem.to === item.to),
      );
      expect(
        owningSections.length,
        `"${item.to}" should appear in exactly one ADMIN_SECTIONS bucket, found in ${owningSections.length} (${owningSections.map((s) => s.id).join(', ')})`,
      ).toBe(1);
    }
  });

  it('lights Co-op on a grant year', () => {
    expect(
      isAdminNavItemActive('/admin/grants/2026', '/admin/governance'),
    ).toBe(true);
    expect(isAdminNavItemActive('/admin/grants/2026', '/admin')).toBe(false);
    expect(isAdminNavItemActive('/admin/governance', '/admin/governance')).toBe(
      true,
    );
  });

  it('has six one-word sections in plan order', () => {
    expect(ADMIN_SECTIONS.map((section) => section.label)).toEqual([
      'Overview',
      'Inbox',
      'People',
      'Content',
      'Co-op',
      'Platform',
    ]);
  });

  it('finds the section for a page, a hub and a grant year', () => {
    expect(adminSectionForPath('/admin')?.id).toBe('overview');
    expect(adminSectionForPath('/admin/moderation?tab=support')?.id).toBe(
      'inbox',
    );
    expect(adminSectionForPath('/admin/users')?.id).toBe('people');
    expect(adminSectionForPath('/admin/hubs/content')?.id).toBe('content');
    expect(adminSectionForPath('/admin/news')?.id).toBe('content');
    expect(adminSectionForPath('/admin/grants/2026')?.id).toBe('coop');
    expect(adminSectionForPath('/admin/storage/user-1')?.id).toBe('platform');
    expect(adminSectionForPath('/admin/map')?.id).toBe('platform');
  });

  it("lists a hub section's pages on its hub, without the hub itself", () => {
    const platform = adminHubItems('/admin/hubs/platform').map(
      (item) => item.to,
    );
    expect(platform).toContain('/admin/addons');
    expect(platform).toContain('/admin/map');
    expect(platform).not.toContain('/admin/hubs/platform');
    expect(adminHubItems('/admin/hubs/coop').map((item) => item.to)).toEqual([
      '/admin/governance',
      '/admin/financial',
    ]);
    expect(adminHubItems('/admin/nope')).toEqual([]);
  });

  it('names every admin route either as a nav page or as a tab-only route', () => {
    const routerDir = join(__dirname, '..', 'router');
    const paths = readdirSync(routerDir)
      .filter((file) => file.endsWith('.tsx'))
      .flatMap((file) =>
        [
          ...readFileSync(join(routerDir, file), 'utf8').matchAll(
            /path: '(\/admin[^']*)'/g,
          ),
        ].map((match) => match[1]),
      );
    const known = new Set<string>([
      ...PRIMARY.map((item) => item.to),
      ...ADMIN_TAB_ONLY_ROUTES,
    ]);
    expect(paths.length).toBeGreaterThan(30);
    expect(paths.filter((path) => !known.has(path))).toEqual([]);
  });
});
