import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { Badge } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { DmRoleBadge } from '../DmRoleBadge';
import { PageEmpty } from '../PageStates';
import { type TopNavState } from './useTopNavState';

/** The messages quick view; the account menu's Messages item opens it. */
export function MessagesPopover({ nav }: { nav: TopNavState }) {
  const { t } = useTranslation('web');
  const { messagesOpen, setMessagesOpen, conversations } = nav;

  return (
    <div className="relative">
      {messagesOpen ? (
        <div
          className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">
              {t('messagesPopover.title')}
            </span>
            <Link
              to="/messages"
              role="menuitem"
              onClick={() => setMessagesOpen(false)}
              className="text-accent-cyan-strong text-xs hover:underline"
            >
              {t('messagesPopover.openAll')}
            </Link>
          </div>
          {conversations.length === 0 ? (
            <PageEmpty title={t('messagesPopover.empty')} />
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
                <span className="bg-primary/20 text-primary-strong flex size-7 shrink-0 items-center justify-center rounded-full font-semibold">
                  {conversation.otherUser.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-medium">
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="truncate">
                        {conversation.otherUser.displayName}
                      </span>
                      <DmRoleBadge
                        role={conversation.otherUser.channelRole}
                        className="shrink-0"
                      />
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <Badge variant="pill" color="red">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-foreground-secondary block truncate">
                    {conversation.lastMessage?.body ??
                      t('messagesPopover.noMessages')}
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
