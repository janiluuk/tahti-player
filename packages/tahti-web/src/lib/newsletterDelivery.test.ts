import { describe, expect, it } from 'vitest';

import { newsletterDeliverySummary } from './newsletterDelivery';

describe('newsletterDeliverySummary', () => {
  it('says where the emails went', () => {
    expect(
      newsletterDeliverySummary({ queued: 1, sent: 2, failed: 1, bounced: 1 }),
    ).toBe('Delivered to 2 · 1 failed · 1 bounced · 1 still sending');
    expect(
      newsletterDeliverySummary({ queued: 0, sent: 12, failed: 0, bounced: 0 }),
    ).toBe('Delivered to 12');
  });

  it('stays silent when nothing was sent or the API is older', () => {
    expect(
      newsletterDeliverySummary({ queued: 0, sent: 0, failed: 0, bounced: 0 }),
    ).toBeNull();
    expect(newsletterDeliverySummary(undefined)).toBeNull();
  });
});
