import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  deletePressKitImage,
  fetchMyPressKitImages,
  fetchPressKitMeta,
  fetchPublicPressKitImages,
  MAX_PRESS_KIT_SELECTED_IMAGES,
  patchPressKitBio,
  removeProfileAvatar,
  setPressKitGalleryPublic,
  updatePressKitImage,
  uploadPressKitImages,
  type PressKitImageItem,
  type PressKitMeta,
} from '../../../api/artist-settings';
import { fetchMeProfile, type ProfileFields } from '../../../api/studio-extras';
import { useAuthStore } from '../../../stores/authStore';

export type UploadMode = 'append' | 'replace';

export const selectedPressKitImages = (images: PressKitImageItem[]) =>
  images
    .filter((image) => image.includeInZip)
    .sort((left, right) => left.position - right.position);

/** Profile, gallery and press-kit state plus every action on them. */
export function usePressKit() {
  const user = useAuthStore((state) => state.user);
  const refreshAuth = useAuthStore((state) => state.refresh);
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [images, setImages] = useState<PressKitImageItem[]>([]);
  const [pressKit, setPressKit] = useState<PressKitMeta | null>(null);
  const [galleryPublic, setGalleryPublic] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('append');
  const [includeUploads, setIncludeUploads] = useState(true);
  const [galleryUploadOpen, setGalleryUploadOpen] = useState(false);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [draggedPressKitImageId, setDraggedPressKitImageId] = useState<
    string | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [pendingReplaceUpload, setPendingReplaceUpload] = useState<{
    files: File[];
    includeInZip: boolean;
  } | null>(null);
  const [pendingImageDeleteId, setPendingImageDeleteId] = useState<
    string | null
  >(null);

  const reload = async () => {
    const [profileResult, imageResult, pressResult] = await Promise.all([
      fetchMeProfile(),
      fetchMyPressKitImages(),
      fetchPressKitMeta(),
    ]);
    setProfile(profileResult.data);
    setImages(imageResult.data);
    setPressKit(pressResult.data);
    const publicResult = await fetchPublicPressKitImages(
      profileResult.data.username,
    );
    setGalleryPublic(publicResult.data.length > 0);
  };

  useEffect(() => {
    reload().catch(() => toast.error('Could not load your branding details.'));
  }, []);

  const setVisibility = async (nextPublic: boolean) => {
    const previous = galleryPublic;
    setGalleryPublic(nextPublic);
    const result = await setPressKitGalleryPublic(nextPublic);
    if (!result.ok) {
      setGalleryPublic(previous);
      toast.error(result.error);
    }
  };

  const enforcePressKitLimit = async (nextImages: PressKitImageItem[]) => {
    const selected = selectedPressKitImages(nextImages);
    const overflow = selected.slice(
      0,
      Math.max(0, selected.length - MAX_PRESS_KIT_SELECTED_IMAGES),
    );
    if (overflow.length === 0) {
      return nextImages;
    }
    await Promise.all(
      overflow.map((image) =>
        updatePressKitImage(image.id, { includeInZip: false }),
      ),
    );
    const dropped = new Set(overflow.map((image) => image.id));
    return nextImages.map((image) =>
      dropped.has(image.id) ? { ...image, includeInZip: false } : image,
    );
  };

  const applyGalleryUpload = async (
    files: readonly File[],
    includeInZip: boolean,
  ) => {
    setBusy(true);
    try {
      // Upload first and only remove the old images once the new ones are
      // stored: a failed upload must never leave the gallery empty.
      const uploaded = await uploadPressKitImages(Array.from(files));
      if (uploaded.images.length === 0) {
        toast.error(uploaded.errors.join('; ') || 'No images were uploaded.');
        return;
      }
      const replaced = uploadMode === 'replace' ? images : [];
      if (replaced.length > 0) {
        await Promise.all(
          replaced.map((image) => deletePressKitImage(image.id)),
        );
      }
      let nextImages = [
        ...(uploadMode === 'replace' ? [] : images),
        ...uploaded.images,
      ];
      if (!includeInZip) {
        await Promise.all(
          uploaded.images.map((image) =>
            updatePressKitImage(image.id, { includeInZip: false }),
          ),
        );
        const uploadedIds = new Set(uploaded.images.map((image) => image.id));
        nextImages = nextImages.map((image) =>
          uploadedIds.has(image.id) ? { ...image, includeInZip: false } : image,
        );
      }
      nextImages = await enforcePressKitLimit(nextImages);
      await setPressKitGalleryPublic(galleryPublic);
      setImages(nextImages);
      setSelectedGalleryFiles([]);
      setGalleryUploadOpen(false);
      if (uploaded.errors.length > 0) {
        toast.error(uploaded.errors.join('; '));
      } else {
        toast.success(
          `${uploaded.images.length} image${uploaded.images.length === 1 ? '' : 's'} added.`,
        );
      }
    } catch {
      toast.error('Could not update the photo gallery.');
    } finally {
      setBusy(false);
    }
  };

  const uploadGallery = async (
    files: readonly File[],
    includeInZip = includeUploads,
  ) => {
    if (files.length === 0) {
      return;
    }
    if (uploadMode === 'replace' && images.length > 0) {
      setPendingReplaceUpload({
        files: Array.from(files),
        includeInZip,
      });
      return;
    }
    await applyGalleryUpload(files, includeInZip);
  };

  const reorderPressKitImages = async (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    const fromIndex = images.findIndex((image) => image.id === fromId);
    const toIndex = images.findIndex((image) => image.id === toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const nextImages = [...images];
    const [movedImage] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, movedImage);
    setImages(nextImages);
    try {
      await Promise.all(
        nextImages.map((image, position) =>
          updatePressKitImage(image.id, { position }),
        ),
      );
    } catch {
      setImages(images);
      toast.error('Could not save the new photo order.');
    }
  };

  const togglePressKitImage = async (image: PressKitImageItem) => {
    const nextIncluded = !image.includeInZip;
    let nextImages = images.map((candidate) =>
      candidate.id === image.id
        ? { ...candidate, includeInZip: nextIncluded }
        : candidate,
    );
    setImages(nextImages);
    const result = await updatePressKitImage(image.id, {
      includeInZip: nextIncluded,
    });
    if (!result.ok) {
      setImages(images);
      toast.error(result.error);
      return;
    }
    nextImages = await enforcePressKitLimit(nextImages);
    setImages(nextImages);
  };

  const removeImage = async (id: string) => {
    const previous = images;
    setImages((current) => current.filter((image) => image.id !== id));
    const result = await deletePressKitImage(id);
    if (!result.ok) {
      setImages(previous);
      toast.error(result.error);
    }
  };

  const removeAvatar = async () => {
    if (!profile) {
      return;
    }
    const result = await removeProfileAvatar();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProfile({ ...profile, avatarUrl: null });
    await refreshAuth();
    toast.success('Profile picture removed.');
  };

  const handleAvatarChange = (url: string) => {
    if (!url) {
      void removeAvatar();
      return;
    }
    setProfile((current) =>
      current ? { ...current, avatarUrl: url } : current,
    );
    void refreshAuth();
  };

  const pressImages = selectedPressKitImages(images);
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl ?? null;

  const saveBio = async () => {
    if (!pressKit) {
      return;
    }
    try {
      const result = await patchPressKitBio(pressKit.bioShort);
      if (result.ok) {
        setPressKit(result.data);
        toast.success('Press kit bio saved.');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Could not save the press kit bio.');
    }
  };

  return {
    user,
    profile,
    images,
    setImages,
    pressKit,
    setPressKit,
    galleryPublic,
    uploadMode,
    setUploadMode,
    includeUploads,
    setIncludeUploads,
    galleryUploadOpen,
    setGalleryUploadOpen,
    selectedGalleryFiles,
    setSelectedGalleryFiles,
    draggedPressKitImageId,
    setDraggedPressKitImageId,
    busy,
    pendingReplaceUpload,
    setPendingReplaceUpload,
    pendingImageDeleteId,
    setPendingImageDeleteId,
    setVisibility,
    applyGalleryUpload,
    uploadGallery,
    reorderPressKitImages,
    togglePressKitImage,
    removeImage,
    handleAvatarChange,
    saveBio,
    pressImages,
    avatarUrl,
  };
}

export type PressKitState = ReturnType<typeof usePressKit>;
