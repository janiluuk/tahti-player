import { describe, expect, it } from 'vitest';

import { announcementDurationSec } from './audioFileDuration';

describe('announcementDurationSec', () => {
  it('rounds a readable length to whole seconds', () => {
    expect(announcementDurationSec(12.4)).toBe(12);
    expect(announcementDurationSec(12.5)).toBe(13);
  });

  it('leaves out lengths the API would refuse or the browser could not read', () => {
    expect(announcementDurationSec(undefined)).toBeUndefined();
    expect(announcementDurationSec(Number.NaN)).toBeUndefined();
    expect(announcementDurationSec(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(announcementDurationSec(0)).toBeUndefined();
    expect(announcementDurationSec(601)).toBeUndefined();
  });
});
