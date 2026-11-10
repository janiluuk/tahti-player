import { describe, expect, it } from 'vitest';

import { toServerFilter, yearBounds } from './studioSoundsFilters';

describe('studioSoundsFilters', () => {
  it('maps a single tag to tag and multiple tags to tags AND', () => {
    expect(
      toServerFilter({
        query: '',
        contentTypeFilter: 'ALL',
        embedFilter: 'ALL',
        uploadedFrom: '',
        uploadedTo: '',
        tags: ['deep'],
      }),
    ).toEqual({ tag: 'deep' });
    expect(
      toServerFilter({
        query: '',
        contentTypeFilter: 'ALL',
        embedFilter: 'ALL',
        uploadedFrom: '',
        uploadedTo: '',
        tags: ['deep', 'house'],
      }),
    ).toEqual({ tags: ['deep', 'house'] });
  });

  it('builds year date bounds', () => {
    expect(yearBounds('2024')).toEqual({
      uploadedFrom: '2024-01-01',
      uploadedTo: '2024-12-31',
    });
  });
});
