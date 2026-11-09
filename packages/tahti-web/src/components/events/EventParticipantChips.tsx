import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { MediaArtwork } from '@tahti-player/ui';

import type { ArtistEventParticipant } from '../../api/events';

export function EventParticipantChips({
  participants,
  showStatus = false,
}: {
  participants: ArtistEventParticipant[];
  showStatus?: boolean;
}) {
  const { t } = useTranslation('web');
  if (participants.length === 0) {
    return null;
  }
  return (
    <ul
      className="flex flex-wrap gap-1.5"
      aria-label={t('events.withParticipants')}
    >
      {participants.map((participant) => {
        const body = (
          <>
            <MediaArtwork
              src={participant.avatarUrl}
              alt=""
              seed={participant.username}
              size="sm"
              className="size-5 rounded-full"
            />
            <span className="truncate">{participant.displayName}</span>
            <span className="text-foreground-secondary">
              {t(`events.role${participant.role}`)}
            </span>
            {showStatus && participant.status !== 'ACCEPTED' ? (
              <span
                className={
                  participant.status === 'DECLINED'
                    ? 'text-accent-red-strong'
                    : 'text-accent-yellow-strong'
                }
              >
                {t(`events.tag${participant.status}`)}
              </span>
            ) : null}
          </>
        );
        const className =
          'border-border bg-background-secondary inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-0.5 text-xs';
        return (
          <li key={participant.username} className="max-w-full">
            {participant.channelSlug && participant.status === 'ACCEPTED' ? (
              <Link
                to="/channel/$slug"
                params={{ slug: participant.channelSlug }}
                className={`${className} hover:underline`}
              >
                {body}
              </Link>
            ) : (
              <span className={className}>{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
