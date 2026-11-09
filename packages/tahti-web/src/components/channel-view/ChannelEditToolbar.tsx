import { RotateCcwIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <div>
        <div className="text-xs font-bold tracking-wide uppercase">
          {t('channelEditToolbar.channelDesign')}
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
          {mobileMenuOpen
            ? t('channelEditToolbarStates.hideMenu')
            : t('channelEditToolbarStates.layersMenu')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!dirty || saving}
          onClick={onRevert}
        >
          <RotateCcwIcon size={14} aria-hidden />
          {t('channelEditToolbar.revertChanges')}
        </Button>
        <SaveButton
          disabled={!dirty}
          saving={saving}
          label={t('channelEditToolbar.saveChanges')}
          savingLabel="Saving…"
          onClick={onSave}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={onDone}
        >
          {t('channelEditToolbar.done')}
        </Button>
      </div>
    </div>
  );
}
