import { KeyboardIcon } from 'lucide-react';

import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { Button, KeyCombo, Popover } from '@tahti-player/ui';

/** What the track table does from the keyboard once it has focus. */
export const LIBRARY_SHORTCUTS: ReadonlyArray<[string, ParseKeys<'web'>]> = [
  ['down', 'libraryShortcutsHelpBatch30.nextTrack'],
  ['enter', 'libraryShortcutsHelpBatch30.playOrLocate'],
  ['space', 'libraryShortcutsHelpBatch30.selectOrDeselect'],
  ['shift+down', 'libraryShortcutsHelpBatch30.extendSelection'],
  ['mod+a', 'libraryShortcutsHelpBatch30.selectAll'],
  ['escape', 'libraryShortcutsHelpBatch30.clearSelection'],
  ['q', 'libraryShortcutsHelpBatch30.addToQueue'],
  ['i', 'libraryShortcutsHelpBatch30.showDetails'],
  ['e', 'libraryShortcutsHelpBatch30.editTags'],
  ['r', 'libraryShortcutsHelpBatch30.revealInFolder'],
  ['p', 'libraryShortcutsHelpBatch30.addToPrepare'],
  ['delete', 'libraryShortcutsHelpBatch30.removeFromLibrary'],
];

export function LibraryShortcutsHelp() {
  const { t } = useTranslation('web');
  return (
    <Popover
      anchor="bottom end"
      panelClassName="w-80"
      tooltip={{
        content: t('libraryShortcutsHelp.keyboardShortcuts'),
        side: 'top',
      }}
      trigger={
        <Button
          size="icon-sm"
          variant="text"
          aria-label={t('libraryShortcutsHelp.keyboardShortcuts')}
        >
          <KeyboardIcon size={14} aria-hidden />
        </Button>
      }
    >
      <p className="pb-2 text-sm font-semibold">
        {t('libraryShortcutsHelp.keyboardShortcuts')}
      </p>
      <p className="pb-2 text-xs opacity-80">
        {t('libraryShortcutsHelp.clickTheTrackListOr')}
      </p>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
        {LIBRARY_SHORTCUTS.map(([shortcut, actionKey]) => (
          <div key={shortcut} className="contents">
            <dt>
              <KeyCombo shortcut={shortcut} />
            </dt>
            <dd>{t(actionKey)}</dd>
          </div>
        ))}
      </dl>
    </Popover>
  );
}
