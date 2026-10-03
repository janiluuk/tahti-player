import { Badge, Tooltip } from '@tahti-player/ui';

const MEMBER_TOOLTIP = 'Supports Tahti ry as a member of the association';

/** Pill beside an artist's name when they are a Tahti ry member. */
export function TahtiMemberBadge({ isMember }: { isMember?: boolean | null }) {
  if (isMember !== true) {
    return null;
  }
  return (
    <Tooltip content={MEMBER_TOOLTIP} side="top" wrapperClassName="inline-flex">
      <Badge
        variant="pill"
        color="secondary"
        tabIndex={0}
        aria-label={`Tahti ry member. ${MEMBER_TOOLTIP}`}
        data-testid="tahti-member-badge"
      >
        Tahti ry member
      </Badge>
    </Tooltip>
  );
}
