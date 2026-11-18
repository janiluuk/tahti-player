import { describe, expect, it, vi } from 'vitest';

import { dropStaleStorage, STALE_STORAGE_KEYS } from './dropStaleStorage';

describe('dropStaleStorage', () => {
  it('removes every stale key', () => {
    const removeItem = vi.fn();
    dropStaleStorage({ removeItem });
    expect(removeItem.mock.calls.map(([key]) => key)).toEqual([
      ...STALE_STORAGE_KEYS,
    ]);
  });

  it('ignores blocked storage', () => {
    const removeItem = vi.fn(() => {
      throw new Error('SecurityError');
    });
    expect(() => dropStaleStorage({ removeItem })).not.toThrow();
  });
});
