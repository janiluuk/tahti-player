import { PencilIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, Textarea } from '@tahti-player/ui';

import { updateNewsPost } from '../api/admin';
import type { Announcement } from '../api/types';
import { hasAccountRole } from '../lib/accountRoles';
import { useAuthStore } from '../stores/authStore';
import { NewsArticleDialog } from './NewsArticleDialog';

export function PlatformNewsDialog({
  post,
  onClose,
  onUpdated,
}: {
  post: Announcement;
  onClose: () => void;
  onUpdated: (post: Announcement) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(post.headline);
  const [summary, setSummary] = useState(post.summary);
  const [imageUrl, setImageUrl] = useState(post.imageUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEdit = user && hasAccountRole(user, 'BOARD');
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await updateNewsPost(post.id, {
        headline: headline.trim(),
        summary: summary.trim(),
        imageUrl: imageUrl.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onUpdated({
        ...post,
        headline: headline.trim(),
        summary: summary.trim(),
        imageUrl: imageUrl.trim() || null,
      });
      setEditing(false);
    } catch {
      setError('Could not save the article. Please try again.');
    } finally {
      setBusy(false);
    }
  };
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
          editing ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <Input
                aria-label="Headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                maxLength={200}
                required
                disabled={busy}
              />
              <Textarea
                aria-label="Article"
                submitOnModEnter
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                maxLength={500}
                required
                disabled={busy}
                rows={6}
              />
              <Input
                aria-label="Image URL"
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
              {error ? <p role="alert">{error}</p> : null}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={busy || !headline.trim() || !summary.trim()}
                >
                  {busy ? 'Saving…' : 'Save article'}
                </Button>
                <Button
                  type="button"
                  variant="text"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="text"
              className="self-start"
              onClick={() => setEditing(true)}
            >
              <PencilIcon size={16} aria-hidden /> Edit article
            </Button>
          )
        ) : null
      }
    />
  );
}
