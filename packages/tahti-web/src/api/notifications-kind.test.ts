import { describe, expect, it } from 'vitest';

import { notificationKindLabel, notificationKindOf } from './notifications';

describe('notificationKindOf', () => {
  it('files types under the same kinds as the API', () => {
    expect(notificationKindOf('NEW_FOLLOWER')).toBe('social');
    expect(notificationKindOf('NEW_RELEASE')).toBe('music');
    expect(notificationKindOf('PAYOUT_SENT')).toBe('money');
    expect(notificationKindOf('FEATURE_REQUEST_UPDATED')).toBe('governance');
    expect(notificationKindOf('SUPPORT_REPLY')).toBe('other');
    expect(notificationKindOf('SOMETHING_NEW')).toBe('other');
  });

  it('labels a type by its kind', () => {
    expect(notificationKindLabel('MOTION_OPENED')).toBe('Governance');
    expect(notificationKindLabel('POLICY')).toBe('Other');
  });
});
