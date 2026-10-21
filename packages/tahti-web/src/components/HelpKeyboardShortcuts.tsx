import { KeyCombo } from '@tahti-player/ui';

import {
  KEYBOARD_NAVIGATION_SECTIONS,
  type KeyboardShortcutSection,
} from '../content/keyboardNavigation';

function ShortcutSection({ section }: { section: KeyboardShortcutSection }) {
  const id = section.heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return (
    <div
      id={id || 'section'}
      className="flex scroll-mt-4 flex-col gap-3"
      data-testid="keyboard-shortcut-section"
    >
      <h2 className="text-foreground text-sm font-semibold tracking-tight">
        {section.heading}
      </h2>
      {section.rows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {section.rows.map((row) => (
            <li
              key={`${row.label}-${row.shortcut}`}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-foreground min-w-0 text-sm">
                {row.label}
              </span>
              <KeyCombo shortcut={row.shortcut} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.notes?.map((note) => (
        <p
          key={note}
          className="text-foreground-secondary text-sm leading-relaxed"
        >
          {note}
        </p>
      ))}
    </div>
  );
}

/** Storybook KeyCombo rows for `/help/keyboard-shortcuts`. */
export function HelpKeyboardShortcuts() {
  return (
    <div className="flex flex-col gap-6" data-testid="help-keyboard-shortcuts">
      {KEYBOARD_NAVIGATION_SECTIONS.map((section) => (
        <ShortcutSection key={section.heading} section={section} />
      ))}
    </div>
  );
}
