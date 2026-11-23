import { useNavigate } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  UserIcon,
} from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  MediaArtwork,
  useDominantColor,
  useMediaArtworkDefaultSrc,
} from '@tahti-player/ui';

import type { UpcomingEvent } from '../../api/upcoming-events';
import { formatEventStart, upcomingEventPlace } from './UpcomingEventCard';

const SWIPE_THRESHOLD_PX = 40;

type Direction = 'next' | 'previous';

/** Upcoming events as one poster at a time with an ambient glow sampled from
 * its image. Browse with the arrow buttons, a mouse drag or touch swipe, or
 * the arrow keys; both ends wrap around. */
export function UpcomingEventsCarousel({
  events,
}: {
  events: UpcomingEvent[];
}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const count = events.length;
  const position = ((index % count) + count) % count;
  const current = events[position]!;
  const imageUrl = current.imageUrl ?? current.avatarUrl ?? undefined;
  const defaultArtwork = useMediaArtworkDefaultSrc(current.id);
  const glowUrl = imageUrl ?? defaultArtwork ?? undefined;
  const glow = useDominantColor(glowUrl);
  const place = upcomingEventPlace(current);
  const browsable = count > 1;

  const go = (step: 1 | -1) => {
    if (!browsable) {
      return;
    }
    setDirection(step === 1 ? 'next' : 'previous');
    setIndex(position + step);
  };

  const open = () => {
    void navigate({ to: '/events/$eventId', params: { eventId: current.id } });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open();
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) {
      return;
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
    suppressClick.current = false;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) {
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      suppressClick.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };

  const onPosterClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    open();
  };

  const slideClass =
    direction === 'next'
      ? 'tahti-poster-enter-next'
      : direction === 'previous'
        ? 'tahti-poster-enter-previous'
        : '';

  return (
    <section
      data-testid="upcoming-events"
      aria-roledescription="carousel"
      aria-label={t('discoverEvents.carouselLabel')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="focus-visible:ring-primary relative flex min-w-0 flex-col gap-3 rounded-xl outline-none focus-visible:ring-2"
    >
      <div className="relative isolate">
        <div
          key={`glow-${current.id}`}
          aria-hidden
          data-testid="upcoming-events-glow"
          className="tahti-poster-glow pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-cover bg-center opacity-45 blur-2xl saturate-150"
          style={glowUrl ? { backgroundImage: `url("${glowUrl}")` } : undefined}
        />
        <div
          className="border-border relative cursor-grab touch-pan-y overflow-hidden rounded-xl border select-none active:cursor-grabbing"
          style={
            glow
              ? {
                  boxShadow: `0 18px 48px -14px rgba(${glow[0]}, ${glow[1]}, ${glow[2]}, 0.75)`,
                }
              : undefined
          }
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragStart.current = null;
          }}
        >
          <article
            key={`${current.id}-${position}`}
            data-testid="upcoming-events-slide"
            aria-roledescription="slide"
            aria-label={t('discoverEvents.eventPosition', {
              current: position + 1,
              total: count,
            })}
            className={`relative cursor-pointer ${slideClass}`}
            onClick={onPosterClick}
            onDragStart={(e) => e.preventDefault()}
          >
            <div className="relative aspect-video w-full">
              <MediaArtwork
                size="fill"
                src={imageUrl}
                alt=""
                seed={current.id}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pt-10 pb-3 text-white">
              <h3
                data-testid="event-card-title"
                className="line-clamp-2 text-base leading-tight font-bold"
                title={current.title}
              >
                {current.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/90">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <CalendarDaysIcon
                    size={13}
                    className="shrink-0"
                    aria-hidden
                  />
                  <time
                    dateTime={current.startAt}
                    data-testid="event-card-start"
                    className="font-semibold"
                  >
                    {formatEventStart(current.startAt, current.timezone)}
                  </time>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <UserIcon size={13} className="shrink-0" aria-hidden />
                  <span className="truncate">{current.artistDisplayName}</span>
                </span>
                {place ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPinIcon size={13} className="shrink-0" aria-hidden />
                    <span data-testid="event-card-venue" className="truncate">
                      {place}
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          </article>
          {browsable ? (
            <>
              <Button
                variant="plain"
                size="icon-sm"
                aria-label={t('discoverEvents.previousEvent')}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => go(-1)}
              >
                <ChevronLeftIcon size={18} aria-hidden />
              </Button>
              <Button
                variant="plain"
                size="icon-sm"
                aria-label={t('discoverEvents.nextEvent')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => go(1)}
              >
                <ChevronRightIcon size={18} aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {browsable ? (
        <p
          data-testid="upcoming-events-position"
          aria-live="polite"
          className="text-foreground-secondary text-center text-xs tabular-nums"
        >
          {position + 1} / {count}
        </p>
      ) : null}
    </section>
  );
}
