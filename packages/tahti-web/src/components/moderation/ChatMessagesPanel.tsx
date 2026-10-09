import { BanIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, EmptyState, Tooltip } from '@tahti-player/ui';

import {
  banChatMessageSender,
  fetchModerationMessages,
  removeChatMessage,
  type ModerationChatMessage,
} from '../../api/chat-moderation';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

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
      title="Recent messages"
      description="The last 100 messages in this chat, fan room included. Remove one, or ban whoever sent it."
    >
      {loading ? (
        <PageLoading label="Loading…" />
      ) : loadError ? (
        <p role="alert" className="text-accent-red text-sm">
          {loadError}
        </p>
      ) : messages.length === 0 ? (
        <EmptyState size="sm" title="No messages yet" />
      ) : (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {messages.map((message) => (
            <li
              key={message.id}
              className="border-border flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold">{message.handle}</span>
                  {message.channelRole && (
                    <Badge variant="pill" color="secondary">
                      {message.channelRole === 'owner' ? 'Owner' : 'Moderator'}
                    </Badge>
                  )}
                  {message.fanOnly && (
                    <Badge variant="pill" color="secondary">
                      Fan room
                    </Badge>
                  )}
                  {message.banned && (
                    <Badge variant="pill" color="secondary">
                      Banned
                    </Badge>
                  )}
                  <span className="text-foreground-secondary text-xs">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="break-words">{message.text}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {message.canBan && !message.banned && (
                  <Tooltip content="Ban sender" side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Ban ${message.handle}`}
                      onClick={() => setPending({ action: 'ban', message })}
                    >
                      <BanIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Remove message" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Remove message from ${message.handle}`}
                    onClick={() => setPending({ action: 'remove', message })}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={pending !== null}
        title={
          pending?.action === 'ban'
            ? `Ban ${pending.message.handle} from this chat?`
            : 'Remove this message?'
        }
        description={
          pending?.action === 'ban'
            ? 'They can no longer post here. Their earlier messages stay until you remove them, and you can lift the ban under Chat bans.'
            : 'It disappears for everyone who opens the chat from now on. People who have the chat open keep it until they reload.'
        }
        confirmLabel={pending?.action === 'ban' ? 'Ban' : 'Remove'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </StudioPanel>
  );
}
