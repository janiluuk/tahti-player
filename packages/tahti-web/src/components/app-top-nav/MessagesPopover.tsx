import { Link } from '@tanstack/react-router';
import { MessageSquareIcon } from 'lucide-react';

import { Badge, Button } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { iconBtnClass } from './shared';
import { type TopNavState } from './useTopNavState';

export function MessagesPopover({ nav }: { nav: TopNavState }) {
  const {
    pathname,
    isMobile,
    setBroadcastOpen,
    messagesOpen,
    setMessagesOpen,
    setNotificationsOpen,
    conversations,
  } = nav;

  return (
    <div className="relative">
      <Button
        variant="text"
        size="icon-sm"
        className={cn(
          iconBtnClass,
          'relative',
          isMobile && 'hidden',
          (messagesOpen || pathname.startsWith('/messages')) &&
            'border-primary bg-primary/15 text-primary',
        )}
        aria-label="Messages"
        aria-haspopup="menu"
        aria-expanded={messagesOpen}
        title="Messages"
        data-tour-id="topbar-messages"
        onClick={() => {
          setMessagesOpen((current) => !current);
          setBroadcastOpen(false);
          setNotificationsOpen(false);
        }}
      >
        <MessageSquareIcon size={16} />
        {conversations.reduce(
          (total, conversation) => total + conversation.unreadCount,
          0,
        ) > 0 ? (
          <Badge
            variant="pill"
            color="red"
            className="absolute -top-1 -right-1 min-w-4 px-1 text-center text-[9px] font-bold"
          >
            {Math.min(
              9,
              conversations.reduce(
                (total, conversation) => total + conversation.unreadCount,
                0,
              ),
            )}
          </Badge>
        ) : null}
      </Button>
      {messagesOpen ? (
        <div
          className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">Messages</span>
            <Link
              to="/messages"
              role="menuitem"
              onClick={() => setMessagesOpen(false)}
              className="text-accent-cyan text-xs hover:underline"
            >
              Open all
            </Link>
          </div>
          {conversations.length === 0 ? (
            <p className="text-foreground-secondary px-2 py-3 text-xs">
              No messages yet.
            </p>
          ) : (
            conversations.slice(0, 5).map((conversation) => (
              <Link
                key={conversation.id}
                to="/messages/$id"
                params={{ id: conversation.id }}
                role="menuitem"
                onClick={() => setMessagesOpen(false)}
                className={cn(
                  'hover:bg-background-secondary flex gap-2 rounded-md px-2 py-2 text-xs',
                  conversation.unreadCount > 0 && 'bg-accent-purple/10',
                )}
              >
                <span className="bg-primary/20 text-primary flex size-7 shrink-0 items-center justify-center rounded-full font-semibold">
                  {conversation.otherUser.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-medium">
                    <span className="truncate">
                      {conversation.otherUser.displayName}
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <Badge variant="pill" color="red">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-foreground-secondary block truncate">
                    {conversation.lastMessage?.body ?? 'No messages yet'}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
