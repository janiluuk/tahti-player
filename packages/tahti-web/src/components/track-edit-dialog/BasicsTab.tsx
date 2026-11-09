import { HelpCircleIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Input, Select, Tooltip } from '@tahti-player/ui';

import { uploadSoundBanner } from '../../api/studio';
import { selectableContentTypes } from '../../content/contentTypes';
import { useUsedBeforeTags } from '../../hooks/useUsedBeforeTags';
import { BackdropUploadButton } from '../BackdropUploadButton';
import { MaterialGenreField } from '../MaterialGenreField';
import { MaterialGroupsField } from '../MaterialGroupsField';
import { MaterialSetsField } from '../MaterialSetsField';
import { MaterialTagsField } from '../MaterialTagsField';
import { MentionTextarea } from '../MentionTextarea';
import { RoundImageUploadButton } from '../RoundImageUploadButton';
import type { TrackEditDialogState } from './useTrackEditDialog';

export function BasicsTab({
  soundId,
  state,
}: {
  soundId: string;
  state: TrackEditDialogState;
}) {
  const { t } = useTranslation('web');
  const { form, setForm, user, isAudioClip, updateArtwork } = state;
  const usedBefore = useUsedBeforeTags();

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl">
        <BackdropUploadButton
          label={t('trackEditBasics.backdrop')}
          value={form.backgroundUrl}
          onChange={(backgroundUrl) => setForm({ ...form, backgroundUrl })}
          fill
        />
        <div className="from-background via-background/85 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="relative flex items-end gap-4 p-4">
          <RoundImageUploadButton
            label={t('trackEditBasics.coverArt')}
            gallery
            value={form.bannerUrl}
            sizeClassName="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
            className="ring-background ring-4"
            upload={(file) =>
              uploadSoundBanner(soundId, file).then((r) =>
                r.ok ? { ok: true as const, data: { url: r.url } } : r,
              )
            }
            onChange={updateArtwork}
          />
          <div className="grid flex-1 gap-3 pb-1 sm:grid-cols-3">
            <Input
              label={t('trackEditBasics.title')}
              value={form.title ?? ''}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground text-sm font-semibold">
                  {t('trackEditBasics.artist')}
                </span>
                <Tooltip
                  content={t('trackEditBasics.defaultsToYourChannelS')}
                  side="top"
                >
                  <HelpCircleIcon
                    size={14}
                    className="text-foreground-secondary"
                    aria-hidden
                  />
                </Tooltip>
              </div>
              <Input
                aria-label={t('trackEditBasics.artist')}
                value={form.artistName ?? user?.displayName ?? ''}
                onChange={(event) =>
                  setForm({ ...form, artistName: event.target.value })
                }
              />
            </div>
            <Select
              label={t('trackEditBasics.contentType')}
              value={form.contentType ?? 'TRACK'}
              onValueChange={(value) =>
                setForm({ ...form, contentType: value })
              }
              options={selectableContentTypes(t).map(({ id, label }) => ({
                id,
                label,
              }))}
            />
          </div>
        </div>
      </div>
      <MentionTextarea
        label={t('trackEditBasics.description')}
        rows={4}
        value={form.description ?? ''}
        onChange={(description) => setForm({ ...form, description })}
      />
      {!isAudioClip ? (
        <Input
          type="date"
          label={t('trackEditBasics.releaseDate')}
          value={form.releaseDate ?? ''}
          onChange={(event) =>
            setForm({ ...form, releaseDate: event.target.value })
          }
          className="w-full max-w-xs min-w-[11rem]"
        />
      ) : null}
      {!isAudioClip ? (
        <MaterialGenreField
          genre={form.genre ?? ''}
          onGenreChange={(genre) => setForm({ ...form, genre })}
          subGenres={form.subGenres ?? []}
          onSubGenresChange={(subGenres) => setForm({ ...form, subGenres })}
        />
      ) : null}
      <MaterialTagsField
        value={form.tags ?? []}
        onChange={(tags) => setForm({ ...form, tags })}
        usedBefore={usedBefore}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <MaterialSetsField soundId={soundId} />
        <MaterialGroupsField soundId={soundId} />
      </div>
    </div>
  );
}
