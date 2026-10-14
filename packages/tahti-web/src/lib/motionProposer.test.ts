import { describe, expect, it } from 'vitest';

import { isMotionProposer } from './motionProposer';

const motion = { id: 'm1', title: 'Draft', state: 'DRAFT', proposer: 'Aino' };

describe('isMotionProposer', () => {
  it('matches the name the API gives the proposer', () => {
    expect(
      isMotionProposer(motion, { displayName: 'Aino', username: 'aino' }),
    ).toBe(true);
    expect(
      isMotionProposer(motion, { displayName: 'Beata', username: 'beata' }),
    ).toBe(false);
  });

  it('falls back to the username like the API does', () => {
    expect(
      isMotionProposer(
        { ...motion, proposer: 'aino' },
        { displayName: 'aino@example.com', username: 'aino' },
      ),
    ).toBe(true);
    expect(
      isMotionProposer(
        { ...motion, proposer: 'aino' },
        { displayName: '  ', username: 'aino' },
      ),
    ).toBe(true);
  });

  it('is false when signed out or the motion names no proposer', () => {
    expect(isMotionProposer(motion, null)).toBe(false);
    expect(
      isMotionProposer(
        { ...motion, proposer: undefined },
        { displayName: 'Aino', username: 'aino' },
      ),
    ).toBe(false);
  });
});
