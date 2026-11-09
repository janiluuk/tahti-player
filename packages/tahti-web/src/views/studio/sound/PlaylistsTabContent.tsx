import { ArchiveIcon, RadioTowerIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { MaterialGroupsField } from '../../../components/MaterialGroupsField';
import { MaterialSetsField } from '../../../components/MaterialSetsField';
import type { SoundEditorState } from './useSoundEditor';

export function PlaylistsTabContent({
  state,
  isAudioClip,
}: {
  state: SoundEditorState;
  isAudioClip: boolean;
}) {
  const { t } = useTranslation('web');
  const {
    item,
    rotationBusy,
    toggleRotation,
    saving,
    visibility,
    moveToStash,
  } = state;

  if (!item) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <MaterialSetsField soundId={item.id} />
        <MaterialGroupsField soundId={item.id} />
      </div>
      <div className="border-border grid gap-3 border-t pt-4 sm:grid-cols-2">
        {!isAudioClip ? (
          <Button
            variant={item.isFallback ? 'secondary' : 'text'}
            disabled={rotationBusy}
            onClick={() => void toggleRotation()}
            aria-pressed={item.isFallback}
          >
            <RadioTowerIcon size={16} aria-hidden className="mr-1.5" />
            {item.isFallback ? 'Remove from rotation' : 'Add to rotation'}
          </Button>
        ) : null}
        <Button
          variant="text"
          disabled={saving || visibility === 'PRIVATE'}
          onClick={() => void moveToStash()}
        >
          <ArchiveIcon size={16} aria-hidden className="mr-1.5" />
          {t('playlistsTabContent.moveToPrivateStash')}
        </Button>
      </div>
    </div>
  );
}
