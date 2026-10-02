import { Badge } from '@tahti-player/ui';

/** Artist-declared label from Studio's track editor (`isAiGenerated`), so
 * listeners know the track was made with generative AI. */
export function AiGeneratedBadge({ show }: { show: boolean | undefined }) {
  if (!show) {
    return null;
  }
  return (
    <Badge
      variant="pill"
      color="secondary"
      title="The artist marked this track as made with generative AI"
      className="shrink-0 bg-white/15 px-2.5 py-1 tracking-wide text-white/80"
    >
      AI-generated
    </Badge>
  );
}
