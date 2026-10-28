import { RotateCcwIcon } from 'lucide-react';

import { Button, SaveButton } from '@tahti-player/ui';

export function ChannelEditToolbar({
  dirty,
  note,
  saving,
  mobileMenuOpen,
  onToggleMobileMenu,
  onSave,
  onRevert,
  onDone,
}: {
  dirty: boolean;
  note: string | null;
  saving: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onSave: () => void;
  onRevert: () => void;
  onDone: () => void;
}) {
  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <div>
        <div className="text-xs font-bold tracking-wide uppercase">
          Channel design
        </div>
        <p className="text-foreground-secondary text-xs">
          Select a block on the page or in Layers, then edit its settings.
          Layout saves in this browser.
          {dirty ? ' · unsaved changes' : ' · saved locally'}
        </p>
        {note && (
          <p className="text-foreground-secondary mt-1 text-xs">{note}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="sm:hidden"
          onClick={onToggleMobileMenu}
        >
          {mobileMenuOpen ? 'Hide menu' : 'Layers menu'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!dirty || saving}
          onClick={onRevert}
        >
          <RotateCcwIcon size={14} aria-hidden />
          Revert changes
        </Button>
        <SaveButton
          disabled={!dirty}
          saving={saving}
          label="Save changes"
          savingLabel="Saving…"
          onClick={onSave}
        />
        <Button size="sm" disabled={saving} onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
