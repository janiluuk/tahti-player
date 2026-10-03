import { describe, expect, it } from 'vitest';

import { socialCallbackToast } from './socialCallback';

describe('socialCallbackToast', () => {
  it.each([
    ['twitter_connected', 'success', 'X / Twitter connected.'],
    ['twitter_error', 'error', 'Could not connect X / Twitter. Try again.'],
    ['instagram_connected', 'success', 'Instagram connected.'],
    ['instagram_error', 'error', 'Could not connect Instagram. Try again.'],
  ])('maps %s to a %s toast', (value, kind, message) => {
    expect(socialCallbackToast(value)).toEqual({ kind, message });
  });

  it.each([null, '', 'twitter', 'myspace_connected', 'twitter_pending'])(
    'ignores %o',
    (value) => {
      expect(socialCallbackToast(value)).toBeNull();
    },
  );
});
