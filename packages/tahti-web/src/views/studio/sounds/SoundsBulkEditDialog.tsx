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

/** Apply shared metadata to every checked sound. */
export function SoundsBulkEditDialog({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const { bulkEditOpen, setBulkEditOpen, selectedIds, applyBulkEdit } = state;
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [contentType, setContentType] = useState<ContentTypeId | ''>('');
  const [visibility, setVisibility] = useState<VisibilityChoice>('');
  const count = selectedIds.size;

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
      <Dialog.Title>
        Edit {count === 1 ? '1 sound' : `${count} sounds`}
      </Dialog.Title>
      <Dialog.Description>
        Only the fields you change are written. Titles stay as they are.
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-genre-label">Genre</span>
          <Select
            id="bulk-genre"
            aria-labelledby="bulk-genre-label"
            value={genre}
            onValueChange={setGenre}
            options={[
              { id: '', label: 'Leave unchanged' },
              ...GENRE_OPTIONS.map((value) => ({ id: value, label: value })),
            ]}
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm" htmlFor="bulk-tags">
          Tags
          <Input
            id="bulk-tags"
            name="bulk-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder={t('library.soundsBulkTagsPlaceholder')}
          />
          <span className="text-foreground-secondary text-xs">
            Comma-separated. Replaces tags on every selected sound.
          </span>
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-content-type-label">Type</span>
          <Select
            id="bulk-content-type"
            aria-labelledby="bulk-content-type-label"
            value={contentType}
            onValueChange={(value) =>
              setContentType(value as ContentTypeId | '')
            }
            options={[
              { id: '', label: 'Leave unchanged' },
              ...SELECTABLE_CONTENT_TYPES.map((type) => ({
                id: type.id,
                label: type.label,
              })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-visibility-label">Visibility</span>
          <Select
            id="bulk-visibility"
            aria-labelledby="bulk-visibility-label"
            value={visibility}
            onValueChange={(value) => setVisibility(value as VisibilityChoice)}
            options={[
              { id: '', label: 'Leave unchanged' },
              { id: 'public', label: 'Public' },
              { id: 'private', label: 'Private' },
            ]}
          />
        </div>
      </div>
      <Dialog.Actions>
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="button" onClick={apply}>
          Apply
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
