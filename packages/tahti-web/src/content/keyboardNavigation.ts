export type KeyboardShortcutRow = {
  label: string;
  /** Binding in KeyCombo form, e.g. `alt+1`, `h`, `left`. */
  shortcut: string;
};

export type KeyboardShortcutSection = {
  heading: string;
  rows: KeyboardShortcutRow[];
  notes?: string[];
};

/** Live AppShell bindings — keep in sync with `AppShell` keydown handler. */
export const KEYBOARD_NAVIGATION_SECTIONS: KeyboardShortcutSection[] = [
  {
    heading: 'Page tour',
    rows: [
      { label: 'Open or close the guided page tour', shortcut: 'h' },
      { label: 'Previous tour step', shortcut: 'left' },
      { label: 'Next tour step', shortcut: 'right' },
      { label: 'Close the tour', shortcut: 'escape' },
    ],
    notes: [
      'The sidebar is explained everywhere; the top bar only on the homepage; Studio and Admin panel items while you’re inside those sections.',
    ],
  },
  {
    heading: 'Navigation',
    rows: [
      { label: 'Listen', shortcut: 'alt+1' },
      { label: 'Radio', shortcut: 'alt+2' },
      { label: 'Feed', shortcut: 'alt+3' },
      { label: 'My Library', shortcut: 'alt+4' },
      { label: 'Studio', shortcut: 'alt+5' },
    ],
  },
  {
    heading: 'Player',
    rows: [
      {
        label: 'Toggle the full-screen player (when a track is loaded)',
        shortcut: 'v',
      },
      {
        label: 'Skip backward (Settings → Playback sets the duration)',
        shortcut: 'shift+left',
      },
      {
        label: 'Skip forward',
        shortcut: 'shift+right',
      },
    ],
  },
  {
    heading: 'Notes',
    rows: [],
    notes: [
      'Shortcuts are disabled while typing in a text field, textarea, dropdown, or any editable content.',
    ],
  },
];
