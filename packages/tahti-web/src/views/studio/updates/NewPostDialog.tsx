import { EyeIcon, NewspaperIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, FilePicker, Input, Textarea } from '@tahti-player/ui';

import {
  createArtistPost,
  uploadArtistPostImage,
} from '../../../api/studio-extras';
import { PostPreview } from './PostPreview';

/** Compose and publish a post (optionally with one image). Mount only while
 * open so the draft starts empty each time. */
export function NewPostDialog({
  onClose,
  onPublished,
  onImageClick,
}: {
  onClose: () => void;
  /** Called after the post exists (even if its image failed to upload). */
  onPublished: () => void;
  onImageClick: (imageUrl: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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

  const publish = async () => {
    if (!body.trim() || busy) {
      return;
    }
    setBusy(true);
    try {
      const r = await createArtistPost({
        title: title.trim() || undefined,
        body: body.trim(),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (image) {
        const imageResult = await uploadArtistPostImage(r.data.id, image);
        if (!imageResult.ok) {
          toast.error(
            `Post published, but image upload failed: ${imageResult.error}`,
          );
          onPublished();
          onClose();
          return;
        }
      }
      toast.success('Post published.');
      onPublished();
      onClose();
    } catch {
      toast.error('Could not publish the post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog.Root isOpen onClose={onClose}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void publish();
          }}
        >
          <Dialog.Title>
            <span className="inline-flex items-center gap-2">
              <NewspaperIcon size={18} aria-hidden />
              New post
            </span>
          </Dialog.Title>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-foreground-secondary text-xs uppercase">
                Body
              </span>
              <Textarea
                tone="secondary"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
              />
            </label>
            <FilePicker
              accept="image/jpeg,image/png,image/webp"
              labels={{
                title: 'Post image',
                description: 'JPEG, PNG, or WebP. One image per post.',
                browse: image ? 'Choose another image' : 'Choose image',
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
            <Dialog.Close>Cancel</Dialog.Close>
            <Button
              type="button"
              variant="secondary"
              disabled={!body.trim()}
              onClick={() => setPreviewOpen(true)}
            >
              <EyeIcon size={16} aria-hidden className="mr-1.5" />
              Preview
            </Button>
            <Button type="submit" disabled={!body.trim() || busy}>
              <PlusIcon size={16} aria-hidden className="mr-1.5" />
              {busy ? 'Publishing…' : 'Publish'}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>

      <Dialog.Root isOpen={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Dialog.Title>Post preview</Dialog.Title>
        <div className="mt-4">
          <PostPreview
            title={title.trim() || null}
            body={body}
            images={imagePreview ? [imagePreview] : []}
            onImageClick={() => {
              if (imagePreview) {
                onImageClick(imagePreview);
              }
            }}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
