import { describe, expect, it } from 'vitest';

import { mockSmartLink } from './mock';

describe('mockSmartLink', () => {
  it('names an unknown release after its slug instead of another release', () => {
    expect(mockSmartLink('night-drive').release.title).toBe('Night Drive');
  });

  it('keeps a known release as it is', () => {
    expect(mockSmartLink('northern-lights-release-1').release.title).toBe(
      'First Light EP',
    );
  });
});
