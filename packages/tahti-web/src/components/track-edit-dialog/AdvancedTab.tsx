import { ListMusicIcon } from 'lucide-react';

import { Button, Select } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import { MusicBrainzSubmissionAssistant } from '../MusicBrainzSubmissionAssistant';
import { TrackCreditsEditor } from '../TrackCreditsEditor';
import type { TrackEditDialogState } from './useTrackEditDialog';

const LICENSES = [
  ['', 'No license (default)'],
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

export function AdvancedTab({
  item,
  state,
}: {
  item: StudioSound;
  state: TrackEditDialogState;
}) {
  const { form, setForm, isAudioClip, setPlaylistOpen } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="sm:max-w-xs">
        <Select
          label="License (optional)"
          value={form.license ?? ''}
          onValueChange={(value) => setForm({ ...form, license: value })}
          options={LICENSES.map(([value, label]) => ({ id: value, label }))}
        />
      </div>
      {!isAudioClip ? (
        <div className="border-border flex items-center gap-4 rounded-xl border p-4">
          <ListMusicIcon
            size={28}
            className="text-primary shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Add this track to playlists</p>
            <p className="text-foreground-secondary text-sm">
              Choose one or more existing playlists, or create a new one.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPlaylistOpen(true)}
          >
            <ListMusicIcon size={15} aria-hidden />
            Choose playlists
          </Button>
        </div>
      ) : null}
      {!isAudioClip ? (
        <MusicBrainzSubmissionAssistant
          mode="track"
          title={item.title}
          artistName={item.artistName ?? ''}
          releaseDate={item.releaseDate}
        />
      ) : null}
      <TrackCreditsEditor
        value={form.credits ?? []}
        onChange={(credits) => setForm({ ...form, credits })}
      />
    </div>
  );
}
