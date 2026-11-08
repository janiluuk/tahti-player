import type { ParseKeys } from '@tahti-player/i18n';

type KeyboardHelpKey = ParseKeys<'web'> & `keyboardHelp.${string}`;

export type KeyboardShortcutRow = {
  labelKey: KeyboardHelpKey;
  /** Binding in KeyCombo form, e.g. `alt+1`, `h`, `left`. */
  shortcut: string;
};

export type KeyboardShortcutSection = {
  /** Stable anchor id, the same in every language. */
  id: string;
  headingKey: KeyboardHelpKey;
  rows: KeyboardShortcutRow[];
  noteKeys?: KeyboardHelpKey[];
};

/** Live AppShell bindings — keep in sync with `AppShell` keydown handler. */
export const KEYBOARD_NAVIGATION_SECTIONS: KeyboardShortcutSection[] = [
  {
    id: 'page-tour',
    headingKey: 'keyboardHelp.pageTour',
    rows: [
      { labelKey: 'keyboardHelp.tourToggle', shortcut: 'h' },
      { labelKey: 'keyboardHelp.tourPrevious', shortcut: 'left' },
      { labelKey: 'keyboardHelp.tourNext', shortcut: 'right' },
      { labelKey: 'keyboardHelp.tourClose', shortcut: 'escape' },
    ],
    noteKeys: ['keyboardHelp.tourNote'],
  },
  {
    id: 'navigation',
    headingKey: 'keyboardHelp.navigation',
    rows: [
      { labelKey: 'keyboardHelp.listen', shortcut: 'alt+1' },
      { labelKey: 'keyboardHelp.radio', shortcut: 'alt+2' },
      { labelKey: 'keyboardHelp.feed', shortcut: 'alt+3' },
      { labelKey: 'keyboardHelp.library', shortcut: 'alt+4' },
      { labelKey: 'keyboardHelp.studio', shortcut: 'alt+5' },
    ],
  },
  {
    id: 'player',
    headingKey: 'keyboardHelp.player',
    rows: [
      { labelKey: 'keyboardHelp.playPause', shortcut: 'space' },
      { labelKey: 'keyboardHelp.fullScreen', shortcut: 'v' },
      { labelKey: 'keyboardHelp.skipBack', shortcut: 'shift+left' },
      { labelKey: 'keyboardHelp.skipForward', shortcut: 'shift+right' },
    ],
  },
  {
    id: 'notes',
    headingKey: 'keyboardHelp.notes',
    rows: [],
    noteKeys: ['keyboardHelp.typingNote'],
  },
];
