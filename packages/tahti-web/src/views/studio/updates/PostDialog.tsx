import {
  CalendarClockIcon,
  EyeIcon,
  NewspaperIcon,
  PlusIcon,
  SaveIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilePicker,
  Input,
  Select,
  Textarea,
} from '@tahti-player/ui';

import {
  POST_CATEGORY_LABELS,
  type PostCategory,
} from '../../../api/community-stories';
import {
  createArtistPost,
  deleteArtistPost,
  isScheduledPost,
  updateArtistPost,
  uploadArtistPostImage,
  type ArtistPost,
  type ArtistPostPatch,
} from '../../../api/studio-extras';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../../../lib/datetimeLocal';
import { isHttpUrl } from '../../../lib/parseRss';
import { toastWithUndo } from '../../../lib/undoToast';
import { PostPreview } from './PostPreview';

/** Compose a new post, or edit `post` when given. A new post can be
 * scheduled; an existing one can be rescheduled only while it is still
 * scheduled, so a published post never silently disappears from the
 * channel. Mount only while open so the form starts fresh each time. */
export function PostDialog({
  post,
  onClose,
  onSaved,
  onImageClick,
}: {
  post?: ArtistPost;
  onClose: () => void;
  /** Called after the post exists (even if its image failed to upload). */
  onSaved: () => void;
  onImageClick: (imageUrl: string) => void;
}) {
  const { t } = useTranslation('web');
  const editing = post !== undefined;
  const canSchedule = !post || isScheduledPost(post);
  const initialPublishAt =
    post && canSchedule ? toDatetimeLocalValue(post.publishAt) : '';

  const initialCategory: PostCategory = post?.category ?? 'STORY';
  const [category, setCategory] = useState<PostCategory>(initialCategory);
  const [title, setTitle] = useState(post?.title ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [linkUrl, setLinkUrl] = useState(post?.linkUrl ?? '');
  const [linkLabel, setLinkLabel] = useState(post?.linkLabel ?? '');
  const [publishAt, setPublishAt] = useState(initialPublishAt);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const trimmedUrl = linkUrl.trim();
  const linkError =
    trimmedUrl && !isHttpUrl(trimmedUrl)
      ? 'Enter a full web address starting with https://'
      : undefined;
  const publishIso = fromDatetimeLocalValue(publishAt);
  const scheduleError =
    publishAt && (!publishIso || Date.parse(publishIso) <= Date.now())
      ? 'Pick a time in the future, or leave it empty to publish now.'
      : undefined;
  const scheduling = Boolean(publishIso) && !scheduleError;
  const canSubmit = Boolean(body.trim()) && !linkError && !scheduleError;
  const previewImages = [
    ...(post?.images ?? []),
    ...(imagePreview ? [imagePreview] : []),
  ];

  const save = async () => {
    if (!canSubmit || busy) {
      return;
    }
    setBusy(true);
    try {
      const label = trimmedUrl ? linkLabel.trim() : '';
      let result;
      if (post) {
        const patch: ArtistPostPatch = {
          title: title.trim() || null,
          body: body.trim(),
          linkUrl: trimmedUrl || null,
          linkLabel: label || null,
        };
        if (category !== initialCategory) {
          patch.category = category;
        }
        if (canSchedule && publishAt !== initialPublishAt) {
          patch.publishAt = publishIso ?? new Date().toISOString();
        }
        result = await updateArtistPost(post.id, patch);
      } else {
        result = await createArtistPost({
          title: title.trim() || undefined,
          body: body.trim(),
          linkUrl: trimmedUrl || undefined,
          linkLabel: label || undefined,
          publishAt: publishIso ?? undefined,
          ...(category === 'STORY' ? {} : { category }),
        });
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (image) {
        const imageResult = await uploadArtistPostImage(result.data.id, image);
        if (!imageResult.ok) {
          toast.error(
            `Post saved, but image upload failed: ${imageResult.error}`,
          );
          onSaved();
          onClose();
          return;
        }
      }
      const savedMessage = isScheduledPost(result.data)
        ? `Post scheduled for ${new Date(result.data.publishAt).toLocaleString()}.`
        : editing
          ? t('postDialogStates.postSaved')
          : t('postDialogStates.postPublished');
      if (editing) {
        toast.success(savedMessage);
      } else {
        const created = result.data;
        toastWithUndo(savedMessage, {
          undo: () => deleteArtistPost(created.id),
          undoneMessage: 'Post removed.',
          onUndone: () => onSaved(),
        });
      }
      onSaved();
      onClose();
    } catch {
      toast.error(i18n.t('web:toasts.couldNotSavePost'));
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = busy
    ? 'Saving…'
    : editing
      ? 'Save'
      : scheduling
        ? t('postDialogStates.schedule')
        : t('postDialogStates.publish');
  const SubmitIcon = editing
    ? SaveIcon
    : scheduling
      ? CalendarClockIcon
      : PlusIcon;

  return (
    <>
      <Dialog.Root isOpen onClose={onClose}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Dialog.Title>
            <span className="inline-flex items-center gap-2">
              <NewspaperIcon size={18} aria-hidden />
              {editing
                ? t('postDialogStates.editPost')
                : t('postDialogStates.newPost')}
            </span>
          </Dialog.Title>
          <div className="mt-4 flex flex-col gap-3">
            <Select
              label={t('postDialog.type')}
              description={t('postDialog.shownOnThePostCard')}
              value={category}
              onValueChange={(value) => setCategory(value as PostCategory)}
              options={(
                Object.keys(POST_CATEGORY_LABELS) as PostCategory[]
              ).map((id) => ({ id, label: POST_CATEGORY_LABELS[id] }))}
            />
            <Input
              label={t('postDialog.titleOptional')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              autoFocus
            />
            <Textarea
              submitOnModEnter
              label={t('postDialog.body')}
              tone="secondary"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={5000}
              required
            />
            <Input
              label={t('postDialog.linkOptional')}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              maxLength={500}
              error={linkError}
            />
            <Input
              label={t('postDialog.linkLabelOptional')}
              description={t('postDialog.shownInsteadOfTheAddress')}
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              maxLength={100}
              disabled={!trimmedUrl}
            />
            {canSchedule && (
              <Input
                label={t('postDialog.publishAtOptional')}
                type="datetime-local"
                description={
                  editing
                    ? t('postDialogStates.yourLocalTimeClearIt')
                    : t('postDialogStates.yourLocalTimeLeaveEmpty')
                }
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                error={scheduleError}
              />
            )}
            <FilePicker
              accept="image/jpeg,image/png,image/webp"
              labels={{
                title: editing
                  ? t('postDialogStates.addAnImage')
                  : t('postDialogStates.postImage'),
                description: t('postDialogFields.jpegPngOrWebpOne'),
                browse: image
                  ? t('postDialogStates.chooseAnotherImage')
                  : t('postDialogStates.chooseImage'),
              }}
              selectedFiles={image ? [image] : []}
              onFiles={(files) => {
                const file = files[0] ?? null;
                setImage(file);
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('postDialog.cancel')}</Dialog.Close>
            <Button
              type="button"
              variant="secondary"
              disabled={!body.trim()}
              onClick={() => setPreviewOpen(true)}
            >
              <EyeIcon size={16} aria-hidden className="mr-1.5" />
              {t('postDialog.preview')}
            </Button>
            <Button type="submit" disabled={!canSubmit || busy}>
              <SubmitIcon size={16} aria-hidden className="mr-1.5" />
              {submitLabel}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>

      <Dialog.Root isOpen={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Dialog.Title>{t('postDialog.postPreview')}</Dialog.Title>
        <div className="mt-4">
          <PostPreview
            title={title.trim() || null}
            body={body}
            linkUrl={trimmedUrl || null}
            linkLabel={linkLabel.trim() || null}
            images={previewImages}
            onImageClick={(index) => {
              const url = previewImages[index];
              if (url) {
                onImageClick(url);
              }
            }}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('postDialog.close')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
