import { useNavigate } from '@tanstack/react-router';
import { Lock, ShieldOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
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
import { syncDocumentMetadata } from '../lib/seo';
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
  const { t } = useTranslation('web');
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
      if (!result.ok) {
        setLoad({ state: 'error', error: result.error });
        return;
      }
      const channel = result.data.find((c) => c.slug === slug) ?? null;
      setLoad({ state: 'ready', channel });
      if (channel) {
        syncDocumentMetadata(window.location.pathname, {
          title: `${channel.displayName}: chat moderation · Tahti`,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, slug, attempt]);

  if (!hydrated) {
    return <PageLoading label={t('loading.loadingSession')} />;
  }
  if (!user) {
    return (
      <EmptyState
        icon={<Lock size={40} className="opacity-40" />}
        title={t('empties.chatModeration')}
        description={t('empties.signInToLookAfterThe')}
        action={
          <Button onClick={() => openAuth('login')}>
            {t('moderateChannelView.logIn')}
          </Button>
        }
      />
    );
  }
  if (load.state === 'loading') {
    return <PageLoading label={t('loading.loading')} />;
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
        title={t('empties.youDonTModerateThisChannel')}
        description={`@${user.username} is not a moderator of this channel's chat. Its owner adds moderators under Studio → Fans.`}
        action={
          <ButtonLink
            to="/channel/$slug"
            params={{ slug }}
            size="sm"
            variant="secondary"
          >
            {t('moderateChannelView.backToTheChannel')}
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
                ? i18n.t('web:batch52.yourChannelModerators')
                : `You moderate this chat for ${channel.displayName}. You can remove messages and ban people from posting.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                to="/channel/$slug"
                params={{ slug }}
                size="sm"
                variant="secondary"
              >
                {t('actions.openChannel')}
              </ButtonLink>
              {channel.isOwner && (
                <ButtonLink to="/studio/fans" size="sm" variant="text">
                  {t('moderateChannelView.chatSettings')}
                </ButtonLink>
              )}
              {!channel.isOwner && (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => setConfirmLeave(true)}
                >
                  {t('moderateChannelView.stopModerating')}
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
        title={t('moderateChannel.stopTitle', { name: channel.displayName })}
        description={t('moderateChannel.stopDescription')}
        confirmLabel={t('moderateChannel.stopConfirm')}
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          void stopModerating(slug).then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success(
              t('toasts.stoppedModerating', { name: channel.displayName }),
            );
            void navigate({ to: '/channel/$slug', params: { slug } });
          });
        }}
      />
    </div>
  );
}
