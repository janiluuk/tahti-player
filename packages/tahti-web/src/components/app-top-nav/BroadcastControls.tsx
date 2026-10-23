import { useNavigate } from '@tanstack/react-router';
import {
  CalendarIcon,
  ListMusicIcon,
  RadioIcon,
  UploadIcon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { iconBtnClass } from './shared';
import { type TopNavState } from './useTopNavState';

export function BroadcastControls({ nav }: { nav: TopNavState }) {
  const navigate = useNavigate();
  const {
    pathname,
    broadcastOpen,
    setBroadcastOpen,
    setStreamManagerOpen,
    setBookingCalendarOpen,
    setMessagesOpen,
    setNotificationsOpen,
    broadcast,
    broadcastTone,
    broadcastToneClass,
  } = nav;

  return (
    <>
      <div className="relative hidden sm:block">
        <Tooltip content="Broadcast status" side="top">
          <Button
            variant="text"
            size="icon-sm"
            className={cn(
              iconBtnClass,
              (broadcastOpen || pathname.startsWith('/studio/go-live')) &&
                'border-primary bg-primary/15 text-primary-strong',
              broadcastToneClass,
            )}
            aria-label={`Open live panel — ${broadcast.label}`}
            aria-haspopup="menu"
            aria-expanded={broadcastOpen}
            data-tour-id="topbar-golive"
            onClick={() => {
              setBroadcastOpen((current) => !current);
              setMessagesOpen(false);
              setNotificationsOpen(false);
            }}
          >
            <RadioIcon size={16} />
          </Button>
        </Tooltip>
        {broadcastOpen ? (
          <div
            className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 min-w-52 rounded-lg border p-2 shadow-lg"
            role="menu"
          >
            <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold">
              <span
                className={cn(
                  'size-2 rounded-full',
                  broadcastTone === 'healthy'
                    ? 'bg-accent-green'
                    : broadcastTone === 'rotation' ||
                        broadcastTone === 'warning'
                      ? 'bg-accent-yellow'
                      : 'bg-foreground-secondary/40',
                  broadcastTone === 'healthy' && 'motion-safe:animate-pulse',
                )}
                aria-hidden
              />
              {broadcast.label}
            </div>
            <Button
              variant="text"
              size="flexible"
              role="menuitem"
              onClick={() => {
                setBroadcastOpen(false);
                setBookingCalendarOpen(true);
              }}
              className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs active:scale-100"
            >
              <CalendarIcon size={14} aria-hidden />
              Booking calendar
            </Button>
            <Button
              variant="text"
              size="flexible"
              role="menuitem"
              onClick={() => {
                setBroadcastOpen(false);
                setStreamManagerOpen(true);
              }}
              className="hover:bg-background-secondary flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs active:scale-100"
            >
              <ListMusicIcon size={14} aria-hidden />
              24/7 rotation
            </Button>
          </div>
        ) : null}
      </div>
      <Tooltip
        content="Open upload"
        side="bottom"
        wrapperClassName="hidden sm:inline-flex"
      >
        <Button
          variant="text"
          size="icon-sm"
          className={iconBtnClass}
          aria-label="Open upload"
          data-tour-id="topbar-upload"
          onClick={() => {
            void navigate({ to: '/library/upload' });
          }}
        >
          <UploadIcon size={16} />
        </Button>
      </Tooltip>
    </>
  );
}
