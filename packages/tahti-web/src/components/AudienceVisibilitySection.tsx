import { Select } from '@tahti-player/ui';

/** A Sound only stores `isPublic`, so these are the only two states that
 * save. Private tracks can still be opened through share links. */
export type TrackVisibility = 'PUBLIC' | 'PRIVATE';

export function visibilityFromIsPublic(
  isPublic: boolean | undefined,
): TrackVisibility {
  return isPublic === false ? 'PRIVATE' : 'PUBLIC';
}

export function AudienceVisibilitySection({
  visibility,
  onVisibilityChange,
}: {
  visibility: TrackVisibility;
  onVisibilityChange: (visibility: TrackVisibility) => void;
}) {
  return (
    <Select
      label="Audience"
      options={[
        { id: 'PUBLIC', label: 'Public' },
        { id: 'PRIVATE', label: 'Private - only you and share links' },
      ]}
      value={visibility}
      onValueChange={(value) => onVisibilityChange(value as TrackVisibility)}
    />
  );
}
