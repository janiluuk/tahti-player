import { BanIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, InlineError, Tooltip } from '@tahti-player/ui';

import {
  banChatMessageSender,
  fetchModerationMessages,
  removeChatMessage,
  type ModerationChatMessage,
} from '../../api/chat-moderation';
import { useAuthStore } from '../../stores/authStore';
import { ChatAvatar } from '../ChatAvatar';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageEmpty, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';
import { moderationTime } from './moderationTime';

type Pending = {
  action: 'remove' | 'ban';
  message: ModerationChatMessage;
};

type Props = {
  /** The channel to moderate; defaults to the signed-in account's own. */
  slug?: string;
  /** Called after a ban, so a ban list next to this panel can reload. */
  onBanned?: () => void;
};

/** The channel's latest chat messages for the people who run the room:
 * remove a message, or ban whoever sent it. */
export function ChatMessagesPanel({ slug: slugProp, onBanned }: Props) {
  const { t } = useTranslation('web');
  const ownSlug = useAuthStore((s) => s.user?.channel?.slug ?? '');
  const slug = slugProp ?? ownSlug;
  const [messages, setMessages] = useState<ModerationChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const reload = useCallback(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    void fetchModerationMessages(slug).then((result) => {
      if (result.ok) {
        setMessages(result.data);
        setLoadError(null);
      } else {
        setLoadError(result.error);
      }
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  const confirm = () => {
    const current = pending;
    setPending(null);
    if (!current) {
      return;
    }
    const { action, message } = current;
    const run =
      action === 'remove'
        ? removeChatMessage(slug, message.id)
        : banChatMessageSender(slug, message.id);
    void run.then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        action === 'remove'
          ? 'Message removed.'
          : `${message.handle} can no longer post in this chat.`,
      );
      if (action === 'ban') {
        onBanned?.();
      }
      reload();
    });
  };

  return (
    <StudioPanel
      title={t('chatMessagesPanel.recentMessages')}
      description={t('chatMessagesPanel.theLast100MessagesIn')}
    >
      {loading ? (
        <PageLoading label={t('loading.loading')} />
      ) : loadError ? (
        <InlineError>{loadError}</InlineError>
      ) : messages.length === 0 ? (
        <PageEmpty title={t('empties.noMessages')} />
      ) : (
        <ul
          className="divide-border flex max-h-96 flex-col divide-y overflow-y-auto"
          aria-label={t('chatMessagesPanel.recentMessages')}
        >
          {messages.map((message) => (
            <li
              key={message.id}
              className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0"
              data-testid="fans-chat-message"
            >
              <ChatAvatar handle={message.handle} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className={
                      message.channelRole === 'owner'
                        ? 'text-primary-strong text-sm font-semibold'
                        : 'text-foreground text-sm font-semibold'
                    }
                  >
                    {message.handle}
                  </span>
                  {message.channelRole ? (
                    <Badge variant="pill" color="secondary">
                      {message.channelRole === 'owner'
                        ? t('chatMessagesPanelStates.owner')
                        : t('chatMessagesPanelStates.moderator')}
                    </Badge>
                  ) : null}
                  {message.fanOnly ? (
                    <Badge variant="pill" color="secondary">
                      {t('chatMessagesPanel.fanRoom')}
                    </Badge>
                  ) : null}
                  {message.banned ? (
                    <Badge variant="pill" color="secondary">
                      {t('chatMessagesPanel.banned')}
                    </Badge>
                  ) : null}
                  <time
                    dateTime={message.createdAt}
                    className="text-foreground-secondary text-xs"
                  >
                    {moderationTime(message.createdAt)}
                  </time>
                </div>
                <p className="text-foreground mt-0.5 text-sm leading-snug break-words">
                  {message.text}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {message.canBan && !message.banned ? (
                  <Tooltip
                    content={t('chatMessagesPanel.banSender')}
                    side="top"
                  >
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={t('chatMessagesPanelLabels.banHandle', {
                        handle: message.handle,
                      })}
                      onClick={() => setPending({ action: 'ban', message })}
                    >
                      <BanIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                ) : null}
                <Tooltip
                  content={t('chatMessagesPanel.removeMessage')}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={t(
                      'chatMessagesPanelLabels.removeMessageFromHandle',
                      { handle: message.handle },
                    )}
                    onClick={() => setPending({ action: 'remove', message })}
                  >
                    <Trash2Icon
                      className="text-accent-red-strong"
                      size={14}
                      aria-hidden
                    />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={pending !== null}
        destructive
        title={
          pending?.action === 'ban'
            ? `Ban ${pending.message.handle} from this chat?`
            : 'Remove this message?'
        }
        description={
          pending?.action === 'ban'
            ? t('chatMessagesPanelStates.theyCanNoLongerPost')
            : t('chatMessagesPanelStates.itDisappearsForEveryoneWho')
        }
        confirmLabel={
          pending?.action === 'ban'
            ? t('chatMessagesPanelStates.ban')
            : t('chatMessagesPanelStates.remove')
        }
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </StudioPanel>
  );
}
