import { HelpCircleIcon } from 'lucide-react';

import { CreatableCombobox, Input, Select, Tooltip } from '@tahti-player/ui';

import { uploadSoundBanner } from '../../api/studio';
import { SELECTABLE_CONTENT_TYPES } from '../../content/contentTypes';
import { capitalizeGenre, PRESET_GENRES } from '../../lib/genres';
import { BackdropUploadButton } from '../BackdropUploadButton';
import { MentionTextarea } from '../MentionTextarea';
import { RoundImageUploadButton } from '../RoundImageUploadButton';
import { SubgenreTagInput } from '../SubgenreTagInput';
import type { TrackEditDialogState } from './useTrackEditDialog';

export function BasicsTab({
  soundId,
  state,
}: {
  soundId: string;
  state: TrackEditDialogState;
}) {
  const { form, setForm, user, isAudioClip, updateArtwork } = state;
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl">
        <BackdropUploadButton
          label="Backdrop"
          value={form.backgroundUrl}
          onChange={(backgroundUrl) => setForm({ ...form, backgroundUrl })}
          fill
        />
        <div className="from-background via-background/85 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
        <div className="relative flex items-end gap-4 p-4">
          <RoundImageUploadButton
            label="Cover art"
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
              label="Title"
              value={form.title ?? ''}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-foreground text-sm font-semibold">
                  Artist
                </span>
                <Tooltip
                  content="Defaults to your channel's artist name — override here for this track only."
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
                value={form.artistName ?? user?.displayName ?? ''}
                onChange={(event) =>
                  setForm({ ...form, artistName: event.target.value })
                }
              />
            </div>
            <Select
              label="Content type"
              value={form.contentType ?? 'TRACK'}
              onValueChange={(value) =>
                setForm({ ...form, contentType: value })
              }
              options={SELECTABLE_CONTENT_TYPES.map(({ id, label }) => ({
                id,
                label,
              }))}
            />
          </div>
        </div>
      </div>
      <MentionTextarea
        label="Description"
        rows={4}
        value={form.description ?? ''}
        onChange={(description) => setForm({ ...form, description })}
      />
      {!isAudioClip ? (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <CreatableCombobox
              label="Genre"
              options={[...PRESET_GENRES]}
              value={form.genre ?? ''}
              onValueChange={(genre) => setForm({ ...form, genre })}
              normalize={capitalizeGenre}
            />
          </div>
          <div className="w-full sm:w-36">
            <Input
              type="date"
              label="Release date"
              value={form.releaseDate ?? ''}
              onChange={(event) =>
                setForm({ ...form, releaseDate: event.target.value })
              }
            />
          </div>
        </div>
      ) : null}
      {!isAudioClip ? (
        <SubgenreTagInput
          value={form.subGenres ?? []}
          onChange={(subGenres) => setForm({ ...form, subGenres })}
        />
      ) : null}
    </div>
  );
}
