import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Select } from '@tahti-player/ui';

import type { StudioSoundBulkPatch } from '../../../api/studio';
import {
  selectableContentTypes,
  type ContentTypeId,
} from '../../../content/contentTypes';
import type { StudioSoundsState } from './useStudioSoundsState';

const LICENSES = [
  ['', ''],
  ['ALL_RIGHTS_RESERVED', 'All rights reserved'],
  ['CC0', 'No rights reserved (CC0)'],
  ['CC_BY', 'Creative Commons Attribution (CC BY)'],
  ['CC_BY_SA', 'Creative Commons Attribution-ShareAlike (CC BY-SA)'],
  ['CC_BY_NC', 'Creative Commons Attribution-NonCommercial (CC BY-NC)'],
  [
    'CC_BY_NC_SA',
    'Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA)',
  ],
  [
    'CC_BY_NC_ND',
    'Creative Commons Attribution-NonCommercial-NoDerivatives (CC BY-NC-ND)',
  ],
] as const;

type VisibilityChoice = '' | 'public' | 'private';
type TriChoice = '' | 'on' | 'off';
type FallbackChoice = '' | 'on' | 'off';
type ReleasedChoice = '' | 'set' | 'clear';
type TagsChoice = '' | 'set' | 'clear';
type PinnedChoice = '' | 'on' | 'off';

export function SoundsBulkEditDialog({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const { bulkEditOpen, setBulkEditOpen, selectedIds, applyBulkEdit, facets } =
    state;
  const [genre, setGenre] = useState('');
  const [genreCustom, setGenreCustom] = useState('');
  const [subGenres, setSubGenres] = useState('');
  const [tagsChoice, setTagsChoice] = useState<TagsChoice>('');
  const [tags, setTags] = useState('');
  const [contentType, setContentType] = useState<ContentTypeId | ''>('');
  const [visibility, setVisibility] = useState<VisibilityChoice>('');
  const [license, setLicense] = useState('');
  const [downloads, setDownloads] = useState<TriChoice>('');
  const [comments, setComments] = useState<TriChoice>('');
  const [releasedChoice, setReleasedChoice] = useState<ReleasedChoice>('');
  const [releasedAt, setReleasedAt] = useState('');
  const [fallback, setFallback] = useState<FallbackChoice>('');
  const [pinned, setPinned] = useState<PinnedChoice>('');
  const count = selectedIds.size;
  const leaveUnchanged = t('library.soundsBulkLeaveUnchanged');
  const genreOptions = [
    ...facets.genre.map((facet) => facet.value),
    'Other',
  ].filter((value, index, all) => all.indexOf(value) === index);

  const close = () => {
    setBulkEditOpen(false);
    setGenre('');
    setGenreCustom('');
    setSubGenres('');
    setTagsChoice('');
    setTags('');
    setContentType('');
    setVisibility('');
    setLicense('');
    setDownloads('');
    setComments('');
    setReleasedChoice('');
    setReleasedAt('');
    setFallback('');
    setPinned('');
  };

  const apply = () => {
    const patch: StudioSoundBulkPatch = {};
    if (genre) {
      patch.genre = genre;
      if (genre === 'Other' && genreCustom.trim()) {
        patch.genreCustom = genreCustom.trim();
      } else if (genre !== 'Other') {
        patch.genreCustom = null;
      }
    }
    if (subGenres.trim()) {
      patch.subGenres = subGenres
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12);
    }
    if (tagsChoice === 'clear') {
      patch.tags = [];
    } else if (tagsChoice === 'set' && tags.trim()) {
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
    if (license) {
      patch.license = license;
    }
    if (downloads === 'on') {
      patch.downloadsEnabled = true;
    }
    if (downloads === 'off') {
      patch.downloadsEnabled = false;
    }
    if (comments === 'on') {
      patch.commentsEnabled = true;
    }
    if (comments === 'off') {
      patch.commentsEnabled = false;
    }
    if (releasedChoice === 'clear') {
      patch.releasedAt = null;
    } else if (releasedChoice === 'set' && releasedAt) {
      patch.releasedAt = new Date(`${releasedAt}T00:00:00.000Z`).toISOString();
    }
    if (fallback === 'on') {
      patch.isFallback = true;
    }
    if (fallback === 'off') {
      patch.isFallback = false;
    }
    if (pinned === 'on') {
      patch.pinned = true;
    }
    if (pinned === 'off') {
      patch.pinned = false;
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
      <div className="mt-4 flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-genre-label">{t('library.soundsBulkGenre')}</span>
          <Select
            id="bulk-genre"
            aria-labelledby="bulk-genre-label"
            value={genre}
            onValueChange={setGenre}
            options={[
              { id: '', label: leaveUnchanged },
              ...genreOptions.map((value) => ({ id: value, label: value })),
            ]}
          />
        </div>
        {genre === 'Other' ? (
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="bulk-genre-custom"
          >
            {t('library.soundsBulkGenreCustom')}
            <Input
              id="bulk-genre-custom"
              name="bulk-genre-custom"
              value={genreCustom}
              onChange={(event) => setGenreCustom(event.target.value)}
              placeholder={t('library.soundsBulkGenreCustomPlaceholder')}
            />
          </label>
        ) : null}
        <label
          className="flex flex-col gap-1.5 text-sm"
          htmlFor="bulk-sub-genres"
        >
          {t('library.soundsBulkSubGenres')}
          <Input
            id="bulk-sub-genres"
            name="bulk-sub-genres"
            value={subGenres}
            onChange={(event) => setSubGenres(event.target.value)}
            placeholder={t('library.soundsBulkSubGenresPlaceholder')}
          />
          <span className="text-foreground-secondary text-xs">
            {t('library.soundsBulkSubGenresHint')}
          </span>
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-tags-choice-label">{t('library.soundsBulkTags')}</span>
          <Select
            id="bulk-tags-choice"
            aria-labelledby="bulk-tags-choice-label"
            value={tagsChoice}
            onValueChange={(value) => setTagsChoice(value as TagsChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'set', label: t('library.soundsBulkTagsReplace') },
              { id: 'clear', label: t('library.soundsBulkTagsClear') },
            ]}
          />
        </div>
        {tagsChoice === 'set' ? (
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="bulk-tags">
            {t('library.soundsBulkTagsValues')}
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
        ) : null}
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
              ...selectableContentTypes(t).map((type) => ({
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
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-pinned-label">{t('library.soundsBulkPinned')}</span>
          <Select
            id="bulk-pinned"
            aria-labelledby="bulk-pinned-label"
            value={pinned}
            onValueChange={(value) => setPinned(value as PinnedChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'on', label: t('library.soundsBulkPinnedOn') },
              { id: 'off', label: t('library.soundsBulkPinnedOff') },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-license-label">{t('library.soundsBulkLicense')}</span>
          <Select
            id="bulk-license"
            aria-labelledby="bulk-license-label"
            value={license}
            onValueChange={setLicense}
            options={LICENSES.map(([id, label]) => ({
              id,
              label: id ? label : leaveUnchanged,
            }))}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-downloads-label">
            {t('library.soundsBulkDownloads')}
          </span>
          <Select
            id="bulk-downloads"
            aria-labelledby="bulk-downloads-label"
            value={downloads}
            onValueChange={(value) => setDownloads(value as TriChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'on', label: t('library.soundsBulkEnabled') },
              { id: 'off', label: t('library.soundsBulkDisabled') },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-comments-label">
            {t('library.soundsBulkComments')}
          </span>
          <Select
            id="bulk-comments"
            aria-labelledby="bulk-comments-label"
            value={comments}
            onValueChange={(value) => setComments(value as TriChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'on', label: t('library.soundsBulkEnabled') },
              { id: 'off', label: t('library.soundsBulkDisabled') },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-released-label">
            {t('library.soundsBulkReleasedAt')}
          </span>
          <Select
            id="bulk-released"
            aria-labelledby="bulk-released-label"
            value={releasedChoice}
            onValueChange={(value) =>
              setReleasedChoice(value as ReleasedChoice)
            }
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'set', label: t('library.soundsBulkSetDate') },
              { id: 'clear', label: t('library.soundsBulkClearDate') },
            ]}
          />
        </div>
        {releasedChoice === 'set' ? (
          <label
            className="flex flex-col gap-1.5 text-sm"
            htmlFor="bulk-released-at"
          >
            {t('library.soundsBulkReleaseDate')}
            <Input
              id="bulk-released-at"
              name="bulk-released-at"
              type="date"
              value={releasedAt}
              onChange={(event) => setReleasedAt(event.target.value)}
            />
          </label>
        ) : null}
        <div className="flex flex-col gap-1.5 text-sm">
          <span id="bulk-fallback-label">
            {t('library.soundsBulkFallback')}
          </span>
          <Select
            id="bulk-fallback"
            aria-labelledby="bulk-fallback-label"
            value={fallback}
            onValueChange={(value) => setFallback(value as FallbackChoice)}
            options={[
              { id: '', label: leaveUnchanged },
              { id: 'on', label: t('library.soundsBulkFallbackOn') },
              { id: 'off', label: t('library.soundsBulkFallbackOff') },
            ]}
          />
          <span className="text-foreground-secondary text-xs">
            {t('library.soundsBulkFallbackHint')}
          </span>
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
