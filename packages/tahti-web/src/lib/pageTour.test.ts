import { describe, expect, it } from 'vitest';

import { getPageTourSteps } from './pageTour';

function ids(pathname: string): string[] {
  return getPageTourSteps(pathname).map((step) => step.id);
}

describe('getPageTourSteps', () => {
  it('annotates page purpose on every route', () => {
    for (const pathname of [
      '/',
      '/radio',
      '/studio/shows',
      '/studio/audience',
      '/admin/users',
      '/library/sounds',
    ]) {
      const steps = getPageTourSteps(pathname);
      expect(steps[0]?.id).toBe('page-purpose');
      expect(steps[0]?.annotationOnly).toBe(true);
      expect(steps[0]?.label.length).toBeGreaterThan(0);
      expect(steps[0]?.description.length).toBeGreaterThan(0);
    }
  });

  it('includes sidebar and top bar chrome only on the homepage', () => {
    expect(ids('/')).toContain('nav-listen');
    expect(ids('/')).toContain('topbar-golive');
    expect(ids('/radio')).not.toContain('nav-listen');
    expect(ids('/radio')).not.toContain('topbar-golive');
    expect(ids('/studio')).not.toContain('nav-listen');
    expect(ids('/admin')).not.toContain('topbar-golive');
  });

  it('does not include Studio/Admin section nav on inner pages', () => {
    expect(ids('/studio/upload')).not.toContain('nav-item-/studio');
    expect(ids('/library')).not.toContain('nav-item-/studio');
    expect(ids('/admin/users')).not.toContain('nav-item-/admin/users');
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

  it('adds order-management steps on Studio Audience (after purpose)', () => {
    const revenueIds = ids('/studio/audience');
    expect(revenueIds[0]).toBe('page-purpose');
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

  it('inner pages without page steps are purpose-only', () => {
    expect(ids('/radio')).toEqual(['page-purpose']);
    expect(ids('/studio/upload')).toEqual(['page-purpose']);
  });
});
