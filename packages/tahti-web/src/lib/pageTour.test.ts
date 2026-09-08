import { describe, expect, it } from 'vitest';

import { getPageTourSteps } from './pageTour';

function ids(pathname: string): string[] {
  return getPageTourSteps(pathname).map((step) => step.id);
}

describe('getPageTourSteps', () => {
  it('always includes the sidebar', () => {
    expect(ids('/radio')).toContain('nav-listen');
    expect(ids('/radio')).toContain('nav-studio');
  });

  it('only includes the top bar on the homepage', () => {
    expect(ids('/')).toContain('topbar-golive');
    expect(ids('/radio')).not.toContain('topbar-golive');
    expect(ids('/studio')).not.toContain('topbar-golive');
    expect(ids('/admin')).not.toContain('topbar-golive');
  });

  it('includes Studio section steps on /studio and /library, not elsewhere', () => {
    const studioIds = ids('/studio/upload');
    expect(studioIds).toContain('nav-item-/studio');
    expect(studioIds).not.toContain('nav-item-/library');
    expect(studioIds).not.toContain('nav-item-tool-Upload');
    expect(ids('/library')).toContain('nav-item-/studio');
    expect(ids('/radio')).not.toContain('nav-item-/studio');
  });

  it('includes Admin panel steps only under /admin', () => {
    const adminIds = ids('/admin/users');
    expect(adminIds).toContain('nav-item-/admin/users');
    expect(ids('/studio')).not.toContain('nav-item-/admin/users');
  });

  it('never produces duplicate step ids', () => {
    for (const pathname of [
      '/',
      '/studio/shows',
      '/studio/audience',
      '/studio/stripe',
      '/admin/users',
      '/library',
    ]) {
      const stepIds = ids(pathname);
      expect(new Set(stepIds).size).toBe(stepIds.length);
    }
  });

  it('gives every step a non-empty label and description', () => {
    for (const step of getPageTourSteps('/studio/shows')) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  it('adds order-management steps on Studio Audience', () => {
    const revenueIds = ids('/studio/audience');
    expect(revenueIds).toEqual(
      expect.arrayContaining([
        'revenue-stats',
        'revenue-orders',
        'revenue-flow',
        'revenue-help',
        'revenue-connect',
      ]),
    );
    expect(ids('/studio/upload')).not.toContain('revenue-stats');
  });

  it('adds Stripe dashboard steps on Studio Stripe', () => {
    const stripeIds = ids('/studio/stripe');
    expect(stripeIds).toEqual(
      expect.arrayContaining([
        'stripe-status',
        'stripe-actions',
        'stripe-charges',
      ]),
    );
    expect(ids('/studio/audience')).not.toContain('stripe-status');
  });
});
