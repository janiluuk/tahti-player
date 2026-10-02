import { describe, expect, it } from 'vitest';

import { channelRenameNote } from './channelRenameNote';

describe('channelRenameNote', () => {
  it('warns that the stream key changed and when the old address stops redirecting', () => {
    const note = channelRenameNote(
      {
        slug: 'new-name',
        rtmpStreamKey: 'new-name__abc',
        previousSlugRedirectExpiresAt: '2026-12-31T12:00:00.000Z',
      },
      'en-GB',
    );
    expect(note).toContain('Renamed to new-name.');
    expect(note).toContain('Your stream key changed');
    expect(note).toContain('OBS');
    expect(note).toContain(
      'Your old address redirects here until 31 December 2026.',
    );
  });

  it('skips the redirect line on a first slug set', () => {
    const note = channelRenameNote({
      slug: 'first',
      rtmpStreamKey: 'first__abc',
      previousSlugRedirectExpiresAt: null,
    });
    expect(note).not.toContain('redirects');
    expect(note).toContain('Your stream key changed');
  });

  it('skips the stream key line when the response carries no key', () => {
    expect(
      channelRenameNote({
        slug: 'same',
        rtmpStreamKey: null,
        previousSlugRedirectExpiresAt: null,
      }),
    ).toBe('Renamed to same.');
  });
});
