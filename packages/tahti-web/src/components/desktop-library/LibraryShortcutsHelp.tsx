import { KeyboardIcon } from 'lucide-react';

import { Button, KeyCombo, Popover } from '@tahti-player/ui';

/** What the track table does from the keyboard once it has focus. */
export const LIBRARY_SHORTCUTS: ReadonlyArray<[string, string]> = [
  ['down', 'Next track (↑ previous, Page Up/Down, Home/End)'],
  ['enter', 'Play, or locate a missing file'],
  ['space', 'Select or deselect'],
  ['shift+down', 'Extend the selection'],
  ['mod+a', 'Select all'],
  ['escape', 'Clear the selection'],
  ['q', 'Add to queue'],
  ['i', 'Show details'],
  ['e', 'Edit tags'],
  ['r', 'Reveal in folder'],
  ['delete', 'Remove from library'],
];

export function LibraryShortcutsHelp() {
  return (
    <Popover
      anchor="bottom end"
      panelClassName="w-80"
      trigger={
        <Button size="icon-sm" variant="text" aria-label="Keyboard shortcuts">
          <KeyboardIcon size={14} aria-hidden />
        </Button>
      }
    >
      <p className="pb-2 text-sm font-semibold">Keyboard shortcuts</p>
      <p className="pb-2 text-xs opacity-80">
        Click the track list or Tab to it first. Q, E and Delete act on the
        whole selection when the focused track is part of it.
      </p>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
        {LIBRARY_SHORTCUTS.map(([shortcut, action]) => (
          <div key={shortcut} className="contents">
            <dt>
              <KeyCombo shortcut={shortcut} />
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </Popover>
  );
}
