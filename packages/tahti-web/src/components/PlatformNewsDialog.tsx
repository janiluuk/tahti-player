import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { EditIconButton } from '@tahti-player/ui';

import type { Announcement } from '../api/types';
import { NewsArticleDialog } from './NewsArticleDialog';
import {
  PlatformNewsEditDialog,
  PlatformNewsRemoveButton,
  PlatformNewsRemoveDialog,
  useCanEditPlatformNews,
} from './PlatformNewsEditDialog';

export function PlatformNewsDialog({
  post,
  onClose,
  onUpdated,
  onRemoved,
}: {
  post: Announcement;
  onClose: () => void;
  onUpdated: (post: Announcement) => void;
  /** Shows the remove action; runs after the post was removed. */
  onRemoved?: (id: string) => void;
}) {
  const { t } = useTranslation('web');
  const canEdit = useCanEditPlatformNews();
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (canEdit && removing && onRemoved) {
    return (
      <PlatformNewsRemoveDialog
        post={post}
        onClose={() => setRemoving(false)}
        onRemoved={onRemoved}
      />
    );
  }

  if (canEdit && editing) {
    return (
      <PlatformNewsEditDialog
        post={post}
        onClose={() => setEditing(false)}
        onUpdated={(updated) => {
          setEditing(false);
          onUpdated(updated);
        }}
      />
    );
  }

  return (
    <NewsArticleDialog
      article={{
        id: post.id,
        title: post.headline,
        paragraphs: post.summary.split(/\n\s*\n/),
        imageUrl: post.imageUrl || '/news-opening.svg',
        publishedAt: post.publishedAt,
        link: post.linkUrl ?? undefined,
      }}
      feedLabel={post.authorName}
      onClose={onClose}
      footer={
        canEdit ? (
          <div className="flex items-center gap-2 self-start">
            <EditIconButton
              label={t('platformNews.editArticle')}
              variant="text"
              onClick={() => setEditing(true)}
            />
            {onRemoved ? (
              <PlatformNewsRemoveButton
                title={post.headline}
                onClick={() => setRemoving(true)}
              />
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
