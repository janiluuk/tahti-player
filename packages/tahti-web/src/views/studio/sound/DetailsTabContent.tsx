import {
  CreatableCombobox,
  Input,
  Select,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import { AudienceVisibilitySection } from '../../../components/AudienceVisibilitySection';
import { AudioRevisionList } from '../../../components/AudioRevisionList';
import { SELECTABLE_CONTENT_TYPES } from '../../../content/contentTypes';
import { capitalizeGenre, PRESET_GENRES } from '../../../lib/genres';
import type { SoundEditorState } from './useSoundEditor';

export function DetailsTabContent({
  id,
  state,
}: {
  id: string;
  state: SoundEditorState;
}) {
  const {
    item,
    user,
    title,
    setTitle,
    contentType,
    setContentType,
    description,
    setDescription,
    isAudioClip,
    releaseDate,
    setReleaseDate,
    genre,
    setGenre,
    visibility,
    setVisibility,
    fanTierIds,
    setFanTierIds,
    downloadsEnabled,
    setDownloadsEnabled,
    commentsEnabled,
    setCommentsEnabled,
    quickMsg,
    revisionTick,
  } = state;

  if (!item) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Select
          label="Content type"
          value={contentType}
          onValueChange={setContentType}
          options={SELECTABLE_CONTENT_TYPES.map(({ id, label }) => ({
            id,
            label,
          }))}
        />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-foreground-secondary text-xs uppercase">
              Description
            </span>
            <Textarea
              tone="secondary"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </label>
        </div>
        {!isAudioClip ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full sm:w-36">
              <Input
                type="date"
                label="Release date"
                value={releaseDate}
                onChange={(event) => setReleaseDate(event.target.value)}
              />
            </div>
            <div className="flex-1">
              <CreatableCombobox
                label="Genre"
                options={[...PRESET_GENRES]}
                value={genre}
                onValueChange={setGenre}
                normalize={capitalizeGenre}
              />
            </div>
          </div>
        ) : null}
        <AudienceVisibilitySection
          visibility={visibility}
          onVisibilityChange={setVisibility}
          tierIds={fanTierIds}
          onTierIdsChange={setFanTierIds}
        />
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span>
            <span className="block font-medium">Allow downloads</span>
            <span className="text-foreground-secondary block text-xs">
              Listeners can download the released audio file.
            </span>
          </span>
          <Toggle
            label="Allow downloads"
            checked={downloadsEnabled}
            onChange={setDownloadsEnabled}
          />
        </div>
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span>
            <span className="block font-medium">Allow comments</span>
            <span className="text-foreground-secondary block text-xs">
              Listeners can discuss this track on its public page.
            </span>
          </span>
          <Toggle
            label="Allow comments"
            checked={commentsEnabled}
            onChange={setCommentsEnabled}
          />
        </div>
      </div>

      {quickMsg && (
        <p className="text-foreground-secondary mt-4 text-xs">{quickMsg}</p>
      )}

      <AudioRevisionList
        soundId={id}
        trackTitle={title || item.title}
        artistName={item.artistName || user?.displayName || 'You'}
        coverUrl={item.bannerUrl}
        reloadToken={revisionTick}
      />
    </>
  );
}
