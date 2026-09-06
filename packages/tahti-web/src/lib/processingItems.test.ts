// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { KEYBOARD_NAVIGATION_SECTIONS } from '../content/keyboardNavigation';
import {
  encodingStatusLabel,
  mergeProcessingItems,
  shouldShowConnectedStatusBar,
} from '../lib/processingItems';

describe('shouldShowConnectedStatusBar', () => {
  it('shows for signed-in users when the compact player is absent', () => {
    expect(
      shouldShowConnectedStatusBar({
        signedIn: true,
        playerBarVisible: true,
        hasPlayable: false,
        fullScreenPlayerOpen: false,
      }),
    ).toBe(true);
  });

  it('hides when the compact player is showing', () => {
    expect(
      shouldShowConnectedStatusBar({
        signedIn: true,
        playerBarVisible: true,
        hasPlayable: true,
        fullScreenPlayerOpen: false,
      }),
    ).toBe(false);
  });

  it('hides even while playing (compact bar stays visible on mobile too)', () => {
    expect(
      shouldShowConnectedStatusBar({
        signedIn: true,
        playerBarVisible: true,
        hasPlayable: true,
        fullScreenPlayerOpen: false,
      }),
    ).toBe(false);
  });

  it('hides while the full-screen player is open', () => {
    expect(
      shouldShowConnectedStatusBar({
        signedIn: true,
        playerBarVisible: false,
        hasPlayable: false,
        fullScreenPlayerOpen: true,
      }),
    ).toBe(false);
  });
});

describe('mergeProcessingItems / encodingStatusLabel', () => {
  it('merges local and archive processing jobs', () => {
    const merged = mergeProcessingItems(
      [{ id: 'a', title: 'Local', status: 'PROCESSING' }],
      [
        { id: 'b', title: 'Archive', status: 'PENDING' },
        { id: 'c', title: 'Ready', status: 'READY' },
      ],
    );
    expect(merged.map((job) => job.id)).toEqual(['a', 'b']);
    expect(encodingStatusLabel(merged)).toBe('Encoding 2 tracks…');
    expect(
      encodingStatusLabel([{ id: 'a', title: 'Solo', status: 'PROCESSING' }]),
    ).toBe('Encoding “Solo”…');
  });
});

describe('KEYBOARD_NAVIGATION_SECTIONS', () => {
  it('covers AppShell global shortcuts', () => {
    const shortcuts = KEYBOARD_NAVIGATION_SECTIONS.flatMap((section) =>
      section.rows.map((row) => row.shortcut),
    );
    expect(shortcuts).toEqual(
      expect.arrayContaining([
        'h',
        'left',
        'right',
        'escape',
        'alt+1',
        'alt+2',
        'alt+3',
        'alt+4',
        'alt+5',
        'v',
      ]),
    );
  });
});
