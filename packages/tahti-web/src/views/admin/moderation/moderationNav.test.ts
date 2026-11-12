import { describe, expect, it } from 'vitest';

import { inboxChipSelected } from './moderationNav';

describe('inboxChipSelected', () => {
  it('keeps the default support queue idle', () => {
    expect(inboxChipSelected('support')).toBe('');
  });

  it('marks a queue the board picked', () => {
    expect(inboxChipSelected('beta')).toBe('beta');
    expect(inboxChipSelected('themes')).toBe('themes');
  });
});
