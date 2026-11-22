import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  Loader,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import { deleteNewsPost, updateNewsPost } from '../api/admin';
import type { Announcement } from '../api/types';
import { hasAccountRole } from '../lib/accountRoles';
import { useAuthStore } from '../stores/authStore';
import { ConfirmDialog } from './ConfirmDialog';

/** Board members edit Tahti platform news; RSS items have no Tahti record. */
export function useCanEditPlatformNews(): boolean {
  const user = useAuthStore((s) => s.user);
  return Boolean(user && hasAccountRole(user, 'BOARD'));
}

function PlatformNewsEditForm({
  post,
  onCancel,
  onUpdated,
}: {
  post: Announcement;
  onCancel: () => void;
  onUpdated: (post: Announcement) => void;
}) {
  const { t } = useTranslation('web');
  const [headline, setHeadline] = useState(post.headline);
  const [summary, setSummary] = useState(post.summary);
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = Boolean(headline.trim() && summary.trim());

  const save = async () => {
    if (!valid || busy) {
      return;
    }
    const changes = {
      headline: headline.trim(),
      summary: summary.trim(),
      imageUrl: imageUrl.trim() || null,
    };
    setBusy(true);
    setError(null);
    try {
      const result = await updateNewsPost(post.id, changes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated({ ...post, ...changes });
    } catch {
      setError(t('batch52.couldNotSaveArticle'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input
          label={t('platformNews.headline')}
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
          maxLength={200}
          required
          disabled={busy}
        />
        <Textarea
          label={t('platformNews.article')}
          submitOnModEnter
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          maxLength={500}
          required
          disabled={busy}
          rows={6}
        />
        <Input
          label={t('platformNews.imageUrl')}
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          disabled={busy}
          placeholder="https://…"
        />
        {error ? (
          <p role="alert" className="text-accent-red-strong text-sm">
            {error}
          </p>
        ) : null}
      </form>
      <Dialog.Actions>
        <Button variant="text" disabled={busy} onClick={onCancel}>
          {t('platformNews.cancel')}
        </Button>
        <Button
          className="gap-1.5"
          disabled={busy || !valid}
          onClick={() => void save()}
        >
          {busy ? <Loader size="inline" shape="circle" /> : null}
          {busy
            ? t('platformNewsDialogStates.saving')
            : t('platformNewsDialogStates.saveArticle')}
        </Button>
      </Dialog.Actions>
    </>
  );
}

/** The one edit modal for a Tahti platform news post, opened from a news
 * list item's edit icon or from the article dialog. */
export function PlatformNewsEditDialog({
  post,
  onClose,
  onUpdated,
}: {
  post: Announcement | null;
  onClose: () => void;
  onUpdated: (post: Announcement) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={post !== null} onClose={onClose}>
      <Dialog.Title>{t('platformNews.editArticle')}</Dialog.Title>
      {post ? (
        <PlatformNewsEditForm
          key={post.id}
          post={post}
          onCancel={onClose}
          onUpdated={onUpdated}
        />
      ) : null}
    </Dialog.Root>
  );
}

/** Red trash icon button that asks to remove a platform news post. */
export function PlatformNewsRemoveButton({
  title,
  onClick,
  className,
}: {
  title: string;
  onClick: () => void;
  className?: string;
}) {
  const { t } = useTranslation('web');
  const label = t('platformNews.removeTitle', { title });
  return (
    <Tooltip content={label} side="top">
      <Button
        size="icon-sm"
        variant="secondary"
        aria-label={label}
        data-testid="news-remove"
        className={className}
        onClick={onClick}
      >
        <Trash2Icon size={14} aria-hidden className="text-accent-red-strong" />
      </Button>
    </Tooltip>
  );
}

/** Confirms, then removes a platform news post. `onRemoved` runs only after
 * the API succeeded; a failure shows an error toast and keeps the post. */
export function PlatformNewsRemoveDialog({
  post,
  onClose,
  onRemoved,
}: {
  post: Announcement | null;
  onClose: () => void;
  onRemoved: (id: string) => void;
}) {
  const { t } = useTranslation('web');
  const remove = async (target: Announcement) => {
    onClose();
    try {
      const result = await deleteNewsPost(target.id);
      if (!result.ok) {
        toast.error(result.error || t('platformNews.removeFailed'));
        return;
      }
      onRemoved(target.id);
      toast.success(t('platformNews.removed', { title: target.headline }));
    } catch {
      toast.error(t('platformNews.removeFailed'));
    }
  };
  return (
    <ConfirmDialog
      destructive
      isOpen={post !== null}
      title={t('platformNews.removeConfirmTitle', {
        title: post?.headline ?? '',
      })}
      description={t('platformNews.removeConfirmDescription')}
      confirmLabel={t('platformNews.remove')}
      onCancel={onClose}
      onConfirm={() => {
        if (post) {
          void remove(post);
        }
      }}
    />
  );
}
