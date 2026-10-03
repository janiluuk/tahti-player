import { describe, expect, it } from 'vitest';

import { containsEmailAddress, safeCreditName } from './displayName';

describe('containsEmailAddress', () => {
  it('finds an email address anywhere in the text', () => {
    expect(containsEmailAddress('jane@example.com')).toBe(true);
    expect(
      containsEmailAddress('Mixed by Jane (jane.doe@mail.example.fi)'),
    ).toBe(true);
    expect(containsEmailAddress('JANE@EXAMPLE.COM')).toBe(true);
  });

  it('ignores names that only use an @ sign', () => {
    expect(containsEmailAddress('DJ @ Home')).toBe(false);
    expect(containsEmailAddress('@jane')).toBe(false);
    expect(containsEmailAddress('jane@localhost')).toBe(false);
    expect(containsEmailAddress('Jane Doe')).toBe(false);
  });
});

describe('safeCreditName', () => {
  it('keeps a plain name, trimmed', () => {
    expect(safeCreditName('  Jane Doe ', 'jane')).toBe('Jane Doe');
  });

  it('falls back to the username when the name holds an email address', () => {
    expect(safeCreditName('jane@example.com', 'jane')).toBe('jane');
  });

  it('falls back to the username when the name is missing or blank', () => {
    expect(safeCreditName(null, 'jane')).toBe('jane');
    expect(safeCreditName(undefined, 'jane')).toBe('jane');
    expect(safeCreditName('   ', 'jane')).toBe('jane');
  });

  it('returns null when there is neither a safe name nor a username', () => {
    expect(safeCreditName('jane@example.com', null)).toBeNull();
    expect(safeCreditName('', null)).toBeNull();
  });
});
