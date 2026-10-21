import { describe, expect, it } from 'vitest';

import { nextPatchVersion } from './shared';

describe('nextPatchVersion', () => {
  it('bumps the patch number of a published version', () => {
    expect(nextPatchVersion('1.2.3')).toBe('1.2.4');
    expect(nextPatchVersion('0.1.9')).toBe('0.1.10');
  });

  it('starts a fresh draft or an unparseable version at 1.0.0', () => {
    expect(nextPatchVersion('0.0.0')).toBe('1.0.0');
    expect(nextPatchVersion('beta')).toBe('1.0.0');
  });
});
