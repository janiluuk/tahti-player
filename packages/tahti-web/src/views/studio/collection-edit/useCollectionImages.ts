import { useState } from 'react';
import { toast } from 'sonner';

import {
  patchCollectionGallery,
  patchStudioCollection,
  uploadCollectionCover,
} from '../../../api/studio';
import type { StudioCollection } from '../../../api/studio-types';
import { uploadUserMediaFile } from '../../../api/user-media';

/** Cover, backdrop and slideshow state plus upload/remove actions. */
export function useCollectionImages(
  slug: string,
  setCol: React.Dispatch<React.SetStateAction<StudioCollection | null>>,
) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);
  /** More than one entry here means the backdrop is a slideshow, not a
   * single still — saved together with the rest of the form via the
   * gallery endpoint (see saveMeta). */
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'backdrop' | null>(
    null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingCoverDelete, setPendingCoverDelete] = useState(false);
  const [pendingFrameDelete, setPendingFrameDelete] = useState<string | null>(
    null,
  );

  const uploadImage = async (files: readonly File[]) => {
    if (files.length === 0 || !uploadTarget) {
      return;
    }
    setUploadingImage(true);
    if (uploadTarget === 'cover') {
      const result = await uploadCollectionCover(slug, files[0]!);
      setUploadingImage(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCoverUrl(result.coverUrl);
      setCol((current) =>
        current ? { ...current, coverUrl: result.coverUrl } : current,
      );
      setUploadTarget(null);
      toast.success('Cover uploaded.');
      return;
    }

    // Backdrop accepts one image (a still) or several (a slideshow) —
    // upload them all, then stage the URLs locally; they're saved together
    // with the rest of the form (see saveMeta).
    const uploaded: string[] = [];
    for (const file of files) {
      const result = await uploadUserMediaFile(file);
      if (!result.ok) {
        setUploadingImage(false);
        toast.error(result.error);
        return;
      }
      uploaded.push(result.data.url);
    }
    setUploadingImage(false);
    setBackdropUrl(uploaded[0]!);
    setSlideshowImages(uploaded);
    setUploadTarget(null);
    toast.success(
      uploaded.length > 1
        ? `${uploaded.length} backdrop images uploaded. Save details to publish them.`
        : 'Backdrop uploaded. Save details to publish it.',
    );
  };

  const removeCover = async () => {
    const result = await patchStudioCollection(slug, { coverUrl: null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCoverUrl(null);
    setCol((current) => (current ? { ...current, coverUrl: null } : current));
    toast.success('Cover removed.');
  };

  const removeBackdrop = async () => {
    const galleryResult = await patchCollectionGallery(slug, {
      slideshowImages: [],
      galleryMode: 'NONE',
    });
    if (!galleryResult.ok) {
      toast.error(galleryResult.error);
      return;
    }
    const result = await patchStudioCollection(slug, { backdropUrl: null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBackdropUrl(null);
    setSlideshowImages([]);
    setCol((current) =>
      current ? { ...current, backdropUrl: null } : current,
    );
    toast.success('Backdrop removed.');
  };

  /** Removing the last frame falls back to the empty placeholder (clears
   * the whole backdrop); otherwise only that frame is dropped from the
   * slideshow. */
  const removeSlideshowFrame = async (url: string) => {
    const next = slideshowImages.filter((image) => image !== url);
    if (next.length === 0) {
      await removeBackdrop();
      return;
    }
    const galleryResult = await patchCollectionGallery(slug, {
      slideshowImages: next,
      galleryMode: next.length > 1 ? 'STATIC_SLIDESHOW' : 'NONE',
    });
    if (!galleryResult.ok) {
      toast.error(galleryResult.error);
      return;
    }
    setSlideshowImages(next);
    setBackdropUrl(next[0] ?? null);
    toast.success('Image removed from backdrop.');
  };

  return {
    coverUrl,
    setCoverUrl,
    backdropUrl,
    setBackdropUrl,
    slideshowImages,
    setSlideshowImages,
    uploadTarget,
    setUploadTarget,
    uploadingImage,
    pendingCoverDelete,
    setPendingCoverDelete,
    pendingFrameDelete,
    setPendingFrameDelete,
    uploadImage,
    removeCover,
    removeBackdrop,
    removeSlideshowFrame,
  };
}
