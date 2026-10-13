import { useNavigate } from '@tanstack/react-router';
import { Lock, ShieldOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, ButtonLink, EmptyState, ViewShell } from '@tahti-player/ui';

import {
  fetchModeratedChannels,
  stopModerating,
  type ModeratedChannel,
} from '../api/chat-moderation';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ChatBansPanel } from '../components/moderation/ChatBansPanel';
import { ChatMessagesPanel } from '../components/moderation/ChatMessagesPanel';
import { PageError, PageLoading } from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

type Load =
  | { state: 'loading' }
  | { state: 'error'; error: string }
  | { state: 'ready'; channel: ModeratedChannel | null };

/** `/moderate/$slug`: the chat of a channel the signed-in account looks
 * after, as its owner or as one of its moderators. A moderator needs no
 * channel of their own to get here, and can step down from the role. */
export function ModerateChannelView({ slug }: { slug: string }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthModalStore((s) => s.open);
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [bansVersion, setBansVersion] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }
    let cancelled = false;
    setLoad({ state: 'loading' });
    void fetchModeratedChannels().then((result) => {
      if (cancelled) {
        return;
      }
      setLoad(
        result.ok
          ? {
              state: 'ready',
              channel: result.data.find((c) => c.slug === slug) ?? null,
            }
          : { state: 'error', error: result.error },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [userId, slug, attempt]);

  if (!hydrated) {
    return <PageLoading label="Loading session…" />;
  }
  if (!user) {
    return (
      <EmptyState
        icon={<Lock size={40} className="opacity-40" />}
        title="Chat moderation"
        description="Sign in to look after the chat of a channel you moderate."
        action={<Button onClick={() => openAuth('login')}>Log in</Button>}
      />
    );
  }
  if (load.state === 'loading') {
    return <PageLoading label="Loading…" />;
  }
  if (load.state === 'error') {
    return (
      <PageError
        description={load.error}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }
  const channel = load.channel;
  if (!channel) {
    return (
      <EmptyState
        icon={<ShieldOff size={40} className="opacity-40" />}
        title="You don't moderate this channel"
        description={`@${user.username} is not a moderator of this channel's chat. Its owner adds moderators in Settings.`}
        action={
          <ButtonLink to="/channel/$slug" params={{ slug }} size="sm">
            Back to the channel
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ViewShell
        title={`${channel.displayName}: chat`}
        classes={{ root: 'px-0 pt-0' }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-foreground-secondary text-sm">
              {channel.isOwner
                ? 'Your channel. Who may post and who moderates is under Settings, Channel.'
                : `You moderate this chat for ${channel.displayName}. You can remove messages and ban people from posting.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                to="/channel/$slug"
                params={{ slug }}
                size="sm"
                variant="secondary"
              >
                Open channel
              </ButtonLink>
              {!channel.isOwner && (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setConfirmLeave(true)}
                >
                  Stop moderating
                </Button>
              )}
            </div>
          </div>
          <ChatMessagesPanel
            slug={slug}
            onBanned={() => setBansVersion((v) => v + 1)}
          />
          <ChatBansPanel key={bansVersion} slug={slug} />
        </div>
      </ViewShell>
      <ConfirmDialog
        isOpen={confirmLeave}
        title={`Stop moderating ${channel.displayName}?`}
        description="You lose the moderator role on this channel. Only its owner can give it back."
        confirmLabel="Stop moderating"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          void stopModerating(slug).then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(`You no longer moderate ${channel.displayName}.`);
            void navigate({ to: '/channel/$slug', params: { slug } });
          });
        }}
      />
    </div>
  );
}
