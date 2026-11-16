import { beforeAll, describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import {
  attendanceStatusLabel,
  meetingStateLabel,
  motionStateLabel,
} from './governanceLabels';

describe('governance labels', () => {
  beforeAll(async () => {
    await i18n.loadLanguages('fi_FI');
  });

  it('names motion states and attendance in English and Finnish', () => {
    const en = i18n.getFixedT('en_US', 'web');
    const fi = i18n.getFixedT('fi_FI', 'web');
    expect(motionStateLabel('OPEN', en)).toBe('Open');
    expect(motionStateLabel('CLOSED', fi)).toBe('Suljettu');
    expect(attendanceStatusLabel('EXCUSED', en)).toBe('Excused');
    expect(attendanceStatusLabel('ABSENT', fi)).toBe('Poissa');
    expect(meetingStateLabel('SCHEDULED', en)).toBe('Scheduled');
  });

  it('reads an unknown value in sentence case instead of a raw enum', () => {
    const en = i18n.getFixedT('en_US', 'web');
    expect(motionStateLabel('UNDER_REVIEW', en)).toBe('Under review');
    expect(attendanceStatusLabel('REMOTE', en)).toBe('Remote');
  });
});
