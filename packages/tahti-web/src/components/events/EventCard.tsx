import { Link } from '@tanstack/react-router';
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, ExternalLink, MediaArtwork } from '@tahti-player/ui';

import type { ArtistEvent } from '../../api/events';
import { formatScheduleWindow } from '../../lib/scheduleTime';
import { EventParticipantChips } from './EventParticipantChips';
import { EventStatusBadge } from './EventStatusBadge';

function eventLocalTime(startAt: string, timezone: string | null) {
  if (!timezone) {
    return null;
  }
  try {
    if (timezone === Intl.DateTimeFormat().resolvedOptions().timeZone) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(startAt));
  } catch {
    return null;
  }
}

export type EventCardHost = {
  displayName: string;
  channelSlug: string | null;
};

export function EventCard({
  event,
  host,
  linkToPage = false,
  showDescription = true,
  showPendingTags = false,
  badge,
  actions,
}: {
  event: ArtistEvent;
  host?: EventCardHost;
  linkToPage?: boolean;
  showDescription?: boolean;
  showPendingTags?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useTranslation('web');
  const cancelled = event.status === 'CANCELLED';
  const participants = showPendingTags
    ? event.participants
    : event.participants.filter((p) => p.status === 'ACCEPTED');
  const ticketUrl = event.ticketUrl ?? event.eventUrl;
  const localTime = eventLocalTime(event.startAt, event.timezone);

  return (
    <article
      data-testid="event-card"
      className="border-border bg-background flex gap-3 rounded-lg border p-3 text-sm"
    >
      <MediaArtwork
        src={event.imageUrl}
        alt=""
        seed={event.id}
        size="thumb"
        className="size-20 shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`min-w-0 text-base font-semibold ${cancelled ? 'line-through opacity-70' : ''}`}
          >
            {linkToPage && event.status !== 'DRAFT' ? (
              <Link
                to="/events/$eventId"
                params={{ eventId: event.id }}
                className="hover:underline"
              >
                {event.title}
              </Link>
            ) : (
              event.title
            )}
          </h3>
          <EventStatusBadge status={event.status} />
          {event.visibility === 'FANS' ? (
            <Badge variant="pill" color="purple">
              {t('events.fansOnly')}
            </Badge>
          ) : null}
          {badge}
        </div>
        {host ? (
          <p className="text-foreground-secondary text-xs">
            {host.channelSlug ? (
              <Link
                to="/channel/$slug"
                params={{ slug: host.channelSlug }}
                className="hover:underline"
              >
                {host.displayName}
              </Link>
            ) : (
              host.displayName
            )}
          </p>
        ) : null}
        <p className="text-foreground-secondary flex items-center gap-1.5 text-xs">
          <CalendarDaysIcon size={14} aria-hidden />
          <time dateTime={event.startAt}>
            {formatScheduleWindow(event.startAt, event.endAt)}
          </time>
          {localTime && event.timezone ? (
            <span data-testid="event-local-time">
              ·{' '}
              {t('events.localTime', {
                time: localTime,
                zone: event.timezone.replace(/_/g, ' '),
              })}
            </span>
          ) : null}
        </p>
        <p className="text-foreground-secondary flex items-center gap-1.5 text-xs">
          <MapPinIcon size={14} aria-hidden />
          {[event.venue?.name ?? event.place, event.location]
            .filter(Boolean)
            .join(', ')}
        </p>
        {showDescription && event.description ? (
          <p className="text-foreground-secondary line-clamp-3 text-xs whitespace-pre-wrap">
            {event.description}
          </p>
        ) : null}
        <EventParticipantChips
          participants={participants}
          showStatus={showPendingTags}
        />
        {(ticketUrl && !cancelled) || actions ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ticketUrl && !cancelled ? (
              <ExternalLink
                href={ticketUrl}
                className="text-primary-strong inline-flex items-center gap-1 text-xs"
              >
                <TicketIcon size={14} aria-hidden />
                {event.ticketUrl ? t('events.tickets') : t('events.eventLink')}
              </ExternalLink>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  );
}
