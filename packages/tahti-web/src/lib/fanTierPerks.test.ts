import { describe, expect, it } from 'vitest';

import { humanizeFanTierPerk } from './fanTierPerks';

describe('humanizeFanTierPerk', () => {
  it('labels known perk codes', () => {
    expect(humanizeFanTierPerk('FAN_CHAT')).toBe('Fan chat');
    expect(humanizeFanTierPerk('FLAC')).toBe('Lossless downloads');
  });

  it('shows custom perks as typed', () => {
    expect(humanizeFanTierPerk('Signed postcard')).toBe('Signed postcard');
  });
});
