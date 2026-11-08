import { useTranslation } from '@tahti-player/i18n';
import { Badge, Tooltip } from '@tahti-player/ui';

/** Artist-declared label from Studio's track editor (`isAiGenerated`), so
 * listeners know the track was made with generative AI. */
export function AiGeneratedBadge({ show }: { show: boolean | undefined }) {
  const { t } = useTranslation('web');
  if (!show) {
    return null;
  }
  return (
    <Tooltip
      content={t('aiGeneratedBadge.theArtistMarkedThisTrack')}
      side="top"
      wrapperClassName="shrink-0"
    >
      <Badge
        variant="pill"
        color="secondary"
        aria-description={t('aiGeneratedBadge.theArtistMarkedThisTrack')}
        className="shrink-0 bg-white/15 px-2.5 py-1 tracking-wide text-white/80"
      >
        {t('aiGeneratedBadge.aiGenerated')}
      </Badge>
    </Tooltip>
  );
}
