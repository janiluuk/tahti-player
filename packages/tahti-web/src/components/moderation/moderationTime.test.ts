import { describe, expect, it } from 'vitest';

import { moderationTime } from './moderationTime';

describe('moderationTime', () => {
  it('shows the date and the time without seconds', () => {
    const iso = '2026-10-08T19:42:37.000Z';
    const text = moderationTime(iso);
    expect(text).toBe(
      new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    );
    expect(text).toMatch(/42/);
    expect(text).not.toMatch(/:37/);
  });
});
