import { describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import {
  groupMembersLabel,
  groupPersonName,
  groupSoundsLabel,
} from './groupPeople';

describe('groupPeople', () => {
  const t = i18n.getFixedT('en', 'web');

  it('falls back from email display names to username', () => {
    expect(
      groupPersonName({
        username: 'nova',
        displayName: 'nova@example.com',
      }),
    ).toBe('nova');
    expect(
      groupPersonName({ username: 'nova', displayName: 'Nova Drift' }),
    ).toBe('Nova Drift');
  });

  it('formats member and sound counts for GroupsDirectory', () => {
    expect(groupMembersLabel(1, t)).toMatch(/1/);
    expect(groupMembersLabel(3, t)).toMatch(/3/);
    expect(groupSoundsLabel(1, t)).toMatch(/1/);
    expect(groupSoundsLabel(4, t)).toMatch(/4/);
  });
});
