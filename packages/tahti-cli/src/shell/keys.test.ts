import { describe, expect, it } from 'vitest';

import { resolveKeyAction } from './keys.mjs';

describe('resolveKeyAction', () => {
  it('maps global playback keys', () => {
    expect(resolveKeyAction({ full: 'space' }, { focus: 'list' })).toBe(
      'togglePause',
    );
    expect(resolveKeyAction({ full: 'n' }, { focus: 'list' })).toBe('next');
    expect(resolveKeyAction({ full: 'p' }, { focus: 'list' })).toBe('prev');
    expect(resolveKeyAction({ full: 'left' }, { focus: 'list' })).toBe(
      'seekBack',
    );
    expect(resolveKeyAction({ full: 'right' }, { focus: 'list' })).toBe(
      'seekForward',
    );
  });

  it('routes arrows to nav or list based on focus', () => {
    expect(resolveKeyAction({ full: 'up' }, { focus: 'nav' })).toBe('navUp');
    expect(resolveKeyAction({ full: 'down' }, { focus: 'list' })).toBe(
      'listDown',
    );
    expect(resolveKeyAction({ full: 'j' }, { focus: 'nav' })).toBe('navDown');
    expect(resolveKeyAction({ full: 'k' }, { focus: 'list' })).toBe('listUp');
  });

  it('handles help overlay and search focus', () => {
    expect(
      resolveKeyAction({ full: 'q' }, { focus: 'list', helpVisible: true }),
    ).toBe('helpToggle');
    expect(
      resolveKeyAction({ full: 'n' }, { focus: 'list', helpVisible: true }),
    ).toBeNull();
    expect(resolveKeyAction({ full: 'enter' }, { focus: 'search' })).toBe(
      'searchSubmit',
    );
    expect(resolveKeyAction({ full: 'escape' }, { focus: 'search' })).toBe(
      'searchCancel',
    );
  });

  it('maps queue and quit shortcuts', () => {
    expect(resolveKeyAction({ full: 'a' }, { focus: 'list' })).toBe('enqueue');
    expect(resolveKeyAction({ full: 'c' }, { focus: 'list' })).toBe(
      'clearQueue',
    );
    expect(resolveKeyAction({ full: 'q' }, { focus: 'list' })).toBe('quit');
    expect(resolveKeyAction({ full: 'tab' }, { focus: 'list' })).toBe(
      'toggleFocus',
    );
    expect(resolveKeyAction({ full: '/' }, { focus: 'list' })).toBe(
      'searchFocus',
    );
  });
});
