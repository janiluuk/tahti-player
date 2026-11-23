import { MessageSquarePlus } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Textarea } from '@tahti-player/ui';

import { deleteComment } from '../api/comments';
import { fetchEventComments, postEventComment } from '../api/event-comments';
import type { TrackComment } from '../api/types';
import { toastWithUndo } from '../lib/undoToast';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';
import { CommentItem } from './CommentItem';
import { ConfirmDialog } from './ConfirmDialog';
import { PageEmpty } from './PageStates';

const MAX_COMMENT_LENGTH = 2000;

export function EventComments({
  eventId,
  isHost,
}: {
  eventId: string;
  isHost: boolean;
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
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchEventComments(eventId).then((result) => {
      if (!cancelled && result.data) {
        setComments(result.data.comments);
        setEnabled(result.data.commentsEnabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

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
    const result = await postEventComment(eventId, trimmed);
    setPosting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const created = result.data;
    setComments((current) => [...(current ?? []), created]);
    setBody('');
    toastWithUndo(t('eventComments.commentPosted'), {
      undo: () => deleteComment(created.id),
      undoneMessage: t('eventComments.commentRemoved'),
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
      ? t('eventComments.emptyFirstSignedIn')
      : t('eventComments.emptyFirstGuest')
    : t('eventComments.emptyDisabled');

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('eventComments.ariaLabel')}
      data-testid="event-comments"
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        {t('eventComments.title')}
      </h2>
      {comments.length === 0 ? (
        <PageEmpty
          className="items-start p-0 text-left"
          title={t('eventComments.emptyTitle')}
          description={emptyDescription}
          action={
            !enabled ? undefined : user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => composerRef.current?.focus()}
              >
                <MessageSquarePlus size={16} aria-hidden />
                {t('emptyActions.beFirstToComment')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAuth('login')}
              >
                {t('eventComments.logInToComment')}
              </Button>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-4" data-testid="event-comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={
                user && (isHost || comment.authorUsername === user.username)
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
            {t('eventComments.emptyDisabled')}
          </p>
        ) : null
      ) : user ? (
        <form
          className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => void submit(event)}
          data-testid="event-comments-composer"
        >
          <Textarea
            ref={composerRef}
            submitOnModEnter
            aria-label={t('eventComments.writeAria')}
            placeholder={t('eventComments.placeholder')}
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
            {posting ? t('eventComments.posting') : t('eventComments.post')}
          </Button>
        </form>
      ) : comments.length > 0 ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => openAuth('login')}
        >
          {t('eventComments.logInToComment')}
        </Button>
      ) : null}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        destructive
        title={t('eventComments.removeTitle')}
        description={
          pendingComment?.body ?? t('eventComments.removeFallbackDescription')
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
