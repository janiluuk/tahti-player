import { describe, expect, it } from 'vitest';

import { formatDuration } from './run-script.mjs';

describe('formatDuration', () => {
  it('shows seconds, then minutes and padded seconds', () => {
    expect(formatDuration(4_200)).toBe('4s');
    expect(formatDuration(59_400)).toBe('59s');
    expect(formatDuration(137_000)).toBe('2m 17s');
    expect(formatDuration(600_000)).toBe('10m 00s');
  });
});
