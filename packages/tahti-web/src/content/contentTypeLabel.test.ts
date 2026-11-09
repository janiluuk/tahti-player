import { describe, expect, it } from 'vitest';

import { contentTypeLabel } from './contentTypes';

describe('contentTypeLabel for codes outside the catalog', () => {
  it('reads them as words instead of raw codes', () => {
    expect(contentTypeLabel('LIVE_SET')).toBe('Live set');
    expect(contentTypeLabel('STASH')).toBe('Stash');
    expect(contentTypeLabel('custom/type')).toBe('custom/type');
    expect(contentTypeLabel('TRACK')).toBe('Track');
  });
});
