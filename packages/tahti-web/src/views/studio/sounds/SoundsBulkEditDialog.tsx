import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Select } from '@tahti-player/ui';

import type { StudioSoundBulkPatch } from '../../../api/studio';
import {
  SELECTABLE_CONTENT_TYPES,
  type ContentTypeId,
} from '../../../content/contentTypes';
import type { StudioSoundsState } from './useStudioSoundsState';

const GENRE_OPTIONS = [
  'Electronic',
  'House',
  'Techno',
  'Trance',
  'Drum & Bass',
  'Dubstep',
  'Ambient',
  'Hip-Hop',
  'Pop',
  'Rock',
  'Jazz',
  'Classical',
  'Podcast',
  'Other',
] as const;

type VisibilityChoice = '' | 'public' | 'private';

export function SoundsBulkEditDialog({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const { bulkEditOpen, setBulkEditOpen, selectedIds, applyBulkEdit } = state;
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [contentType, setContentType] = useState<ContentTypeId | ''>('');
  const [visibility, setVisibility] = useState<VisibilityChoice>('');
  const count = selectedIds.size;
  const leaveUnchanged = t('library.soundsBulkLeaveUnchanged');

  const close = () => {
    setBulkEditOpen(false);
    setGenre('');
    setTags('');
    setContentType('');
    setVisibility('');
  };

  const apply = () => {
    const patch: StudioSoundBulkPatch = {};
    if (genre) {
      patch.genre = genre;
    }
    if (tags.trim()) {
      patch.tags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20);
    }
    if (contentType) {
      patch.contentType = contentType;
    }
    if (visibility === 'public') {
      patch.isPublic = true;
    }
    if (visibility === 'private') {
      patch.isPublic = false;
    }
    if (Object.keys(patch).length === 0) {
      return;
    }
    applyBulkEdit(patch);
    close();
  };

  return (
    <Dialog.Root isOpen={bulkEditOpen} onClose={close} className="max-w-md">
      <Dialog.Title>{t('library.soundsBulkEditTitle', { count })}</Dialog.Title>
      <Dialog.Description>
        {t('library.soundsBulkEditDescription')}
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-genre-label">{t('library.soundsBulkGenre')}</span>
          <Select
            id="bulk-genre"
            aria-labelledby="bulk-genre-label"
            value={genre}
            onValueChange={setGenre}
            options={[
              { id: '', label: leaveUnchanged },
              ...GENRE_OPTIONS.map((value) => ({ id: value, label: value })),
            ]}
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm" htmlFor="bulk-tags">
          {t('library.soundsBulkTags')}
          <Input
            id="bulk-tags"
            name="bulk-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder={t('library.soundsBulkTagsPlaceholder')}
          />
          <span className="text-foreground-secondary text-xs">
            {t('library.soundsBulkTagsHint')}
          </span>
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-content-type-label">
            {t('library.soundsBulkType')}
          </span>
          <Select
            id="bulk-content-type"
            aria-labelledby="bulk-content-type-label"
            value={contentType}
            onValueChange={(value) =>
              setContentType(value as ContentTypeId | '')
            }
            options={[
              { id: '', label: leaveUnchanged },
              ...SELECTABLE_CONTENT_TYPES.map((type) => ({
                id: type.id,
                label: type.label,
              })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-visibility-label">
            {t('library.soundsBulkVisibility')}
          </span>
          <Select
            id="bulk-visibility"
            aria-labelledby="bulk-visibility-label"
            value={visibility}
            onValueChange={(value) => setVisibility(value as VisibilityChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'public', label: t('library.soundsBulkPublic') },
              { id: 'private', label: t('library.soundsBulkPrivate') },
            ]}
          />
        </div>
      </div>
      <Dialog.Actions>
        <Button type="button" variant="secondary" onClick={close}>
          {t('actions.cancel')}
        </Button>
        <Button type="button" onClick={apply}>
          {t('actions.apply')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
