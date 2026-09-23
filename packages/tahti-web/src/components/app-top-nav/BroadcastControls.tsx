import { Link } from '@tanstack/react-router';
import {
  CalendarIcon,
  ListMusicIcon,
  MessageSquareIcon,
  RadioIcon,
  UploadIcon,
} from 'lucide-react';

import { Button } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { iconBtnClass } from './shared';
import { type TopNavState } from './useTopNavState';

export function BroadcastControls({ nav }: { nav: TopNavState }) {
  const {
    pathname,
    user,
    setUploadOpen,
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
        <Button
          variant="text"
          size="icon-sm"
          className={cn(
            iconBtnClass,
            (broadcastOpen || pathname.startsWith('/studio/go-live')) &&
              'border-primary bg-primary/15 text-primary',
            broadcastToneClass,
          )}
          aria-label={`Open live panel — ${broadcast.label}`}
          aria-haspopup="menu"
          aria-expanded={broadcastOpen}
          title="Broadcast status"
          data-tour-id="topbar-golive"
          onClick={() => {
            setBroadcastOpen((current) => !current);
            setMessagesOpen(false);
            setNotificationsOpen(false);
          }}
        >
          <RadioIcon size={16} />
        </Button>
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
            {user?.username ? (
              <Link
                to="/u/$username/green-room"
                params={{ username: user.username }}
                role="menuitem"
                onClick={() => setBroadcastOpen(false)}
                className="hover:bg-background-secondary flex items-center gap-2 rounded-md px-2 py-2 text-xs"
              >
                <MessageSquareIcon size={14} aria-hidden />
                Open Green Room chat
              </Link>
            ) : null}
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
      <Button
        variant="text"
        size="icon-sm"
        className={cn('hidden sm:inline-flex', iconBtnClass)}
        aria-label="Open upload"
        title="Open upload"
        data-tour-id="topbar-upload"
        onClick={() => setUploadOpen(true)}
      >
        <UploadIcon size={16} />
      </Button>
    </>
  );
}
