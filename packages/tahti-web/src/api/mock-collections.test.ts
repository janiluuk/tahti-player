import { describe, expect, it } from 'vitest';

import { mockCollection, mockProfile } from './mock';

describe('mock collections', () => {
  it("opens each artist's own vault from their profile link", () => {
    const [vault] = mockProfile('aino').collections;
    expect(vault?.slug).toBe('aino-favorites-vault');

    const collection = mockCollection(vault!.slug);
    expect(collection.user.username).toBe('aino');
    expect(collection.name).toBe('Favorites vault');
  });

  it('keeps the bare slug for Northern Lights', () => {
    expect(mockCollection('favorites-vault').user.username).toBe(
      'northern-lights',
    );
  });
});
