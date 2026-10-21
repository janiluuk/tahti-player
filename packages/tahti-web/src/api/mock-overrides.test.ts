import { afterEach, describe, expect, it } from 'vitest';

import { mockChannel, mockProfile, mockTrackDetail } from './mock';
import {
  deepMerge,
  mockFixture,
  resetMockOverrides,
  setMockOverrides,
} from './mock-overrides';

afterEach(() => {
  resetMockOverrides();
});

describe('deepMerge', () => {
  it('merges nested objects and replaces arrays', () => {
    expect(
      deepMerge(
        { a: { b: 1, c: 2 }, list: [1, 2] },
        { a: { c: 3 }, list: [9] },
      ),
    ).toEqual({ a: { b: 1, c: 3 }, list: [9] });
  });

  it('returns the patch when the base is null', () => {
    expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
  });
});

describe('mockFixture', () => {
  it('passes fixtures through when no override is set', () => {
    expect(mockFixture('radio', null as never)).toBeNull();
    expect(mockProfile('northern-lights').artist.username).toBe(
      'northern-lights',
    );
  });

  it('deep-merges a patch onto the base fixture', () => {
    const base = mockChannel('northern-lights');
    setMockOverrides({ channel: { user: { displayName: 'Override Name' } } });
    const channel = mockChannel('northern-lights');
    expect(channel.user.displayName).toBe('Override Name');
    expect(channel.user.username).toBe(base.user.username);
    expect(channel.slug).toBe(base.slug);
  });

  it('hands function overrides the base and call arguments', () => {
    setMockOverrides({
      profile: (base, username) => ({
        ...base,
        artist: { ...base.artist, bio: `bio for ${username}` },
      }),
    });
    expect(mockProfile('dj-moonlight').artist.bio).toBe('bio for dj-moonlight');
  });

  it('flows channel overrides into derived fixtures', () => {
    setMockOverrides({ channel: { user: { displayName: 'Derived Name' } } });
    expect(mockProfile('northern-lights').artist.displayName).toBe(
      'Derived Name',
    );
  });

  it('clears overrides on reset', () => {
    setMockOverrides({ trackDetail: () => null });
    expect(mockTrackDetail('northern-lights-archive-1')).toBeNull();
    resetMockOverrides();
    expect(mockTrackDetail('northern-lights-archive-1')).not.toBeNull();
  });
});
