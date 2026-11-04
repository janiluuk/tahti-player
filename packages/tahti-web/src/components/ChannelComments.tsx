import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Textarea } from '@tahti-player/ui';

import {
  fetchChannelComments,
  postChannelComment,
} from '../api/channel-comments';
import { deleteComment } from '../api/comments';
import type { TrackComment } from '../api/types';
import { toastWithUndo } from '../lib/undoToast';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { CommentItem } from './CommentItem';
import { ConfirmDialog } from './ConfirmDialog';
import { PageEmpty } from './PageStates';

const MAX_COMMENT_LENGTH = 2000;

export function ChannelComments({
  slug,
  isOwner,
}: {
  slug: string;
  isOwner: boolean;
}) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthModalStore((s) => s.open);
  const [comments, setComments] = useState<TrackComment[] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchChannelComments(slug).then((result) => {
      if (!cancelled && result.data) {
        setComments(result.data.comments);
        setEnabled(result.data.commentsEnabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!comments || (!enabled && comments.length === 0)) {
    return null;
  }

  const pendingComment =
    comments.find((comment) => comment.id === pendingDeleteId) ?? null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    setPosting(true);
    const result = await postChannelComment(slug, trimmed);
    setPosting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const created = result.data;
    setComments((current) => [...(current ?? []), created]);
    setBody('');
    toastWithUndo(t('channelComments.commentPosted'), {
      undo: () => deleteComment(created.id),
      undoneMessage: t('channelComments.commentRemoved'),
      onUndone: () => {
        setComments((current) =>
          (current ?? []).filter((comment) => comment.id !== created.id),
        );
      },
    });
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const result = await deleteComment(id);
    setDeletingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((current) =>
      (current ?? []).filter((comment) => comment.id !== id),
    );
  };

  const emptyDescription = enabled
    ? user
      ? t('channelComments.emptyFirstSignedIn')
      : t('channelComments.emptyFirstGuest')
    : t('channelComments.emptyDisabled');

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('channelComments.ariaLabel')}
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        {t('channelComments.title')}
      </h2>
      {comments.length === 0 ? (
        <PageEmpty
          className="items-start p-0 text-left"
          title={t('channelComments.emptyTitle')}
          description={emptyDescription}
          action={
            !user && enabled ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAuth('login')}
              >
                {t('channelComments.logInToComment')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-4" data-testid="channel-comments">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={
                user && (isOwner || comment.authorUsername === user.username)
                  ? () => setPendingDeleteId(comment.id)
                  : undefined
              }
              deleting={deletingId === comment.id}
            />
          ))}
        </ul>
      )}
      {!enabled ? (
        comments.length > 0 ? (
          <p className="text-foreground-secondary text-sm">
            {t('channelComments.emptyDisabled')}
          </p>
        ) : null
      ) : user ? (
        <form
          className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => void submit(event)}
          data-testid="channel-comments-composer"
        >
          <Textarea
            submitOnModEnter
            aria-label={t('channelComments.writeAria')}
            placeholder={t('channelComments.placeholder')}
            value={body}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => setBody(event.target.value)}
            className="w-full min-w-0 flex-1"
          />
          <Button
            type="submit"
            size="sm"
            className="w-full shrink-0 sm:w-auto sm:self-auto"
            disabled={posting || !body.trim()}
          >
            {posting ? t('channelComments.posting') : t('channelComments.post')}
          </Button>
        </form>
      ) : comments.length > 0 ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => openAuth('login')}
        >
          {t('channelComments.logInToComment')}
        </Button>
      ) : null}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        destructive
        title={t('channelComments.removeTitle')}
        description={
          pendingComment?.body ?? t('channelComments.removeFallbackDescription')
        }
        confirmLabel={t('actions.remove')}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          if (!id) {
            return;
          }
          setPendingDeleteId(null);
          void remove(id);
        }}
      />
    </section>
  );
}
