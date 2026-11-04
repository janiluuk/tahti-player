import { Input, Select, Textarea, Toggle } from '@tahti-player/ui';

import { AudienceVisibilitySection } from '../../../components/AudienceVisibilitySection';
import { AudioRevisionList } from '../../../components/AudioRevisionList';
import { DownloadsSwitch } from '../../../components/DownloadsSwitch';
import { MaterialGenreField } from '../../../components/MaterialGenreField';
import { MaterialTagsField } from '../../../components/MaterialTagsField';
import { SELECTABLE_CONTENT_TYPES } from '../../../content/contentTypes';
import { useUsedBeforeTags } from '../../../hooks/useUsedBeforeTags';
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
    subGenres,
    setSubGenres,
    tags,
    setTags,
    visibility,
    setVisibility,
    downloadsEnabled,
    setDownloadsEnabled,
    commentsEnabled,
    setCommentsEnabled,
    quickMsg,
    revisionTick,
  } = state;
  const usedBefore = useUsedBeforeTags();

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
        <Textarea
          id="sound-description"
          label="Description"
          fieldClassName="sm:col-span-2"
          tone="secondary"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
        {!isAudioClip ? (
          <div className="w-full min-w-0 sm:col-span-2 sm:w-44">
            <Input
              type="date"
              label="Release date"
              value={releaseDate}
              onChange={(event) => setReleaseDate(event.target.value)}
              className="w-full min-w-[11rem]"
            />
          </div>
        ) : null}
        <AudienceVisibilitySection
          visibility={visibility}
          onVisibilityChange={setVisibility}
        />
        {!item.embedProvider ? (
          <DownloadsSwitch
            enabled={downloadsEnabled}
            onChange={setDownloadsEnabled}
          />
        ) : null}
        <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
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

      {!isAudioClip ? (
        <div className="mt-4">
          <MaterialGenreField
            genre={genre}
            onGenreChange={setGenre}
            subGenres={subGenres}
            onSubGenresChange={setSubGenres}
          />
        </div>
      ) : null}

      <div className="mt-4">
        <MaterialTagsField
          value={tags}
          onChange={setTags}
          usedBefore={usedBefore}
        />
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
