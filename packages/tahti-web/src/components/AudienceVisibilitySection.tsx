import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <Select
      label={t('audienceVisibilitySectionText.audience')}
      options={[
        { id: 'PUBLIC', label: t('audienceVisibilitySectionFields.public') },
        {
          id: 'PRIVATE',
          label: t('audienceVisibilitySectionFields.privateOnlyYouAndShare'),
        },
      ]}
      value={visibility}
      onValueChange={(value) => onVisibilityChange(value as TrackVisibility)}
    />
  );
}
