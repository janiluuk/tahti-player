import { describe, expect, it } from 'vitest';

import { ADMIN_SECTIONS, isAdminNavItemActive, PRIMARY } from './AdminNav';

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

  it('lights Community on a grant year', () => {
    expect(
      isAdminNavItemActive('/admin/grants/2026', '/admin/governance'),
    ).toBe(true);
    expect(isAdminNavItemActive('/admin/grants/2026', '/admin')).toBe(false);
    expect(isAdminNavItemActive('/admin/governance', '/admin/governance')).toBe(
      true,
    );
  });
});
