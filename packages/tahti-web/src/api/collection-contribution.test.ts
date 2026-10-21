import { describe, expect, it } from 'vitest';

import { contributionLine } from './collection-contribution';

const base = { position: 1, sound: null, release: null };

describe('contributionLine', () => {
  it('credits a contributor other than the owner, with their note', () => {
    expect(
      contributionLine(
        {
          ...base,
          addedBy: { username: 'mira', displayName: 'Mira' },
          addNote: '  Slaps  ',
        },
        'owner',
      ),
    ).toEqual({ addedByUsername: 'mira', note: 'Slaps' });
  });

  it("doesn't credit the owner but keeps their note", () => {
    expect(
      contributionLine(
        {
          ...base,
          addedBy: { username: 'owner', displayName: 'Owner' },
          addNote: 'Opener',
        },
        'owner',
      ),
    ).toEqual({ addedByUsername: null, note: 'Opener' });
  });

  it('returns null when there is nothing to show', () => {
    expect(contributionLine(base, 'owner')).toBeNull();
    expect(
      contributionLine(
        {
          ...base,
          addedBy: { username: 'owner', displayName: 'Owner' },
          addNote: '   ',
        },
        'owner',
      ),
    ).toBeNull();
    expect(
      contributionLine({ ...base, addedBy: null, addNote: null }, 'owner'),
    ).toBeNull();
  });
});
