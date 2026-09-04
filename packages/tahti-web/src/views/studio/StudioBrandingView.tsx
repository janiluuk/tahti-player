import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  DownloadIcon,
  EyeIcon,
  ImagePlusIcon,
  ImagesIcon,
  PaintbrushIcon,
  PaletteIcon,
  Trash2Icon,
} from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  FilePicker,
  FilterChips,
  Input,
  SaveButton,
  TabLabel,
  Tabs,
  Textarea,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

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
  uploadProfileAvatar,
  type PressKitImageItem,
  type PressKitMeta,
} from '../../api/artist-settings';
import { fetchMeProfile, type ProfileFields } from '../../api/studio-extras';
import { ArtistGalleryPanel } from '../../components/ArtistGalleryPanel';
import { ChannelDesigner } from '../../components/ChannelDesigner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ImageLightbox } from '../../components/ImageLightbox';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { useAuthStore } from '../../stores/authStore';

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp';

export const STUDIO_BRANDING_SECTIONS = [
  'branding',
  'gallery',
  'press-kit',
  'channel-designer',
] as const;

export type StudioBrandingSection = (typeof STUDIO_BRANDING_SECTIONS)[number];

export function isStudioBrandingSection(
  value: string | undefined,
): value is StudioBrandingSection {
  return STUDIO_BRANDING_SECTIONS.some((section) => section === value);
}

type UploadMode = 'append' | 'replace';

const selectedPressKitImages = (images: PressKitImageItem[]) =>
  images
    .filter((image) => image.includeInZip)
    .sort((left, right) => left.position - right.position);

export const StudioBrandingPanel: FC<{
  section?: StudioBrandingSection;
  hideSectionNav?: boolean;
  onSectionChange?: (section: StudioBrandingSection) => void;
}> = ({ section, hideSectionNav = section != null, onSectionChange }) => {
  const user = useAuthStore((state) => state.user);
  const refreshAuth = useAuthStore((state) => state.refresh);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<StudioBrandingSection>(section ?? 'branding');
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
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [pendingReplaceUpload, setPendingReplaceUpload] = useState<{
    files: File[];
    includeInZip: boolean;
  } | null>(null);

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
    void reload();
  }, []);

  useEffect(() => {
    if (section) {
      setTab(section);
    }
  }, [section]);

  const selectSection = (next: StudioBrandingSection) => {
    setTab(next);
    onSectionChange?.(next);
  };

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
    if (uploadMode === 'replace') {
      await Promise.all(images.map((image) => deletePressKitImage(image.id)));
    }
    const uploaded = await uploadPressKitImages(Array.from(files));
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
    setBusy(false);
    setSelectedGalleryFiles([]);
    setGalleryUploadOpen(false);
    if (uploaded.errors.length > 0) {
      toast.error(uploaded.errors.join('; '));
    } else {
      toast.success(
        `${uploaded.images.length} image${uploaded.images.length === 1 ? '' : 's'} added.`,
      );
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
    await Promise.all(
      nextImages.map((image, position) =>
        updatePressKitImage(image.id, { position }),
      ),
    );
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

  const uploadAvatar = async (file: File | undefined) => {
    if (!file || !profile) {
      return;
    }
    setBusy(true);
    const result = await uploadProfileAvatar(file);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProfile({ ...profile, avatarUrl: result.avatarUrl });
    await refreshAuth();
    toast.success('Profile picture updated.');
  };

  const removeAvatar = async () => {
    if (!profile) {
      return;
    }
    setBusy(true);
    const result = await removeProfileAvatar();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProfile({ ...profile, avatarUrl: null });
    await refreshAuth();
    toast.success('Profile picture removed.');
  };

  const pressImages = selectedPressKitImages(images);
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl ?? null;

  return (
    <div className="flex flex-col gap-6">
      {hideSectionNav ? null : (
        <Tabs.Root
          selectedIndex={Math.max(0, STUDIO_BRANDING_SECTIONS.indexOf(tab))}
          onChange={(index) => {
            const next = STUDIO_BRANDING_SECTIONS[index];
            if (next) {
              selectSection(next);
            }
          }}
        >
          <Tabs.List className="w-fit flex-wrap">
            {(
              [
                ['branding', 'Branding', PaletteIcon],
                ['gallery', 'Gallery', ImagesIcon],
                ['press-kit', 'Press kit', DownloadIcon],
                ['channel-designer', 'Channel Designer', PaintbrushIcon],
              ] as const
            ).map(([id, label, Icon]) => (
              <Tabs.Tab key={id}>
                <TabLabel icon={<Icon size={15} />}>{label}</TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      )}

      {tab === 'branding' ? (
        <>
          <StudioPanel
            title="Profile picture"
            description="Use a clear square portrait or mark. Hover the picture to replace or remove it."
          >
            <div className="flex flex-wrap items-center gap-5">
              <div className="group relative size-32 shrink-0">
                <button
                  type="button"
                  className="border-border block size-32 overflow-hidden rounded-full border shadow-lg"
                  aria-label={
                    avatarUrl
                      ? `View ${profile?.displayName ?? 'artist'} profile picture`
                      : 'Upload profile picture'
                  }
                  onClick={() =>
                    avatarUrl
                      ? setAvatarViewerOpen(true)
                      : avatarInputRef.current?.click()
                  }
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary/15 text-primary flex size-full items-center justify-center text-4xl font-bold">
                      {(profile?.displayName ?? user?.displayName ?? 'A')
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/50 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      avatarInputRef.current?.click();
                    }}
                    aria-label={
                      avatarUrl
                        ? 'Replace profile picture'
                        : 'Upload profile picture'
                    }
                    title={avatarUrl ? 'Replace picture' : 'Upload picture'}
                    className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/90 text-black transition-colors hover:bg-white disabled:opacity-50"
                  >
                    <ImagePlusIcon size={16} aria-hidden />
                  </button>
                  {avatarUrl ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        void removeAvatar();
                      }}
                      aria-label="Remove profile picture"
                      title="Remove picture"
                      className="text-accent-red pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Trash2Icon size={16} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  JPEG, PNG, or WebP. The original is kept for full-size use.
                </p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGES}
                  className="sr-only"
                  aria-label="Profile picture"
                  onChange={(event) =>
                    void uploadAvatar(event.target.files?.[0])
                  }
                />
              </div>
            </div>
          </StudioPanel>
        </>
      ) : null}

      {tab === 'channel-designer' ? (
        profile ? (
          <ChannelDesigner
            displayName={profile.displayName}
            username={profile.username}
            channelSlug={user?.channel?.slug}
            avatarUrl={avatarUrl}
            bio={profile.bio}
          />
        ) : (
          <StudioPanel title="Channel Designer">
            <p className="text-foreground-secondary text-sm">
              Sign in to design your public channel.
            </p>
          </StudioPanel>
        )
      ) : null}

      {tab === 'gallery' ? (
        <>
          <StudioPanel
            title="Gallery"
            action={
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-foreground-secondary text-xs">
                    Public
                  </span>
                  <Toggle
                    checked={galleryPublic}
                    onChange={(checked) => void setVisibility(checked)}
                    aria-label="Public gallery"
                  />
                </label>
                <Tooltip content="Upload more gallery images" side="top">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Upload more gallery images"
                    onClick={() => setGalleryUploadOpen(true)}
                  >
                    <ImagePlusIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            }
          >
            <ArtistGalleryPanel
              images={images}
              isOwner
              showUpload={false}
              onChange={(next) => setImages(next as PressKitImageItem[])}
            />
          </StudioPanel>
          <Dialog.Root
            isOpen={galleryUploadOpen}
            onClose={() => {
              if (!busy) {
                setGalleryUploadOpen(false);
                setSelectedGalleryFiles([]);
              }
            }}
            className="max-w-lg"
          >
            <Dialog.Title>Upload gallery images</Dialog.Title>
            <Dialog.Description>
              Add images with drag and drop, or browse your device.
            </Dialog.Description>
            <div className="flex flex-col gap-4">
              <FilterChips
                items={[
                  { id: 'append', label: 'Append' },
                  { id: 'replace', label: 'Replace' },
                ]}
                selected={uploadMode}
                onChange={(id) => setUploadMode(id as 'append' | 'replace')}
                aria-label="Gallery upload mode"
              />
              <FilePicker
                accept={ACCEPTED_IMAGES}
                multiple
                disabled={busy}
                selectedFiles={selectedGalleryFiles}
                labels={{
                  title: 'Drop gallery images here',
                  description: 'JPEG, PNG, or WebP',
                  browse: 'Choose images',
                  selected: 'Ready to upload',
                }}
                onFiles={(files) => {
                  setSelectedGalleryFiles(Array.from(files));
                  void uploadGallery(files);
                }}
              />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Include uploaded images in press kit</span>
                <Toggle
                  label="Include uploaded images in press kit"
                  checked={includeUploads}
                  onChange={setIncludeUploads}
                />
              </div>
            </div>
            <Dialog.Actions>
              <Button
                disabled={busy}
                onClick={() => setGalleryUploadOpen(false)}
              >
                Done
              </Button>
            </Dialog.Actions>
          </Dialog.Root>
        </>
      ) : null}

      {tab === 'press-kit' ? (
        <>
          <StudioPanel
            title="Press kit story"
            description="A concise introduction for promoters, venues, and journalists."
          >
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground-secondary text-xs uppercase">
                Short bio
              </span>
              <Textarea
                tone="secondary"
                rows={5}
                value={pressKit?.bioShort ?? ''}
                onChange={(event) =>
                  setPressKit((current) =>
                    current
                      ? { ...current, bioShort: event.target.value }
                      : current,
                  )
                }
              />
            </label>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {pressKit?.downloadPath ? (
                <a href={pressKit.downloadPath}>
                  <Button size="sm" variant="secondary">
                    <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                    Download ZIP
                  </Button>
                </a>
              ) : null}
              <SaveButton
                disabled={!pressKit}
                label="Save bio"
                onClick={() => {
                  if (!pressKit) {
                    return;
                  }
                  void patchPressKitBio(pressKit.bioShort).then((result) => {
                    if (result.ok) {
                      setPressKit(result.data);
                      toast.success('Press kit bio saved.');
                    } else {
                      toast.error(result.error);
                    }
                  });
                }}
              />
            </div>
          </StudioPanel>
          <StudioPanel
            title="Photos"
            description="Drop in high-resolution promotional photos. Drag to reorder them; the first included photo leads the preview and download."
          >
            <FilePicker
              accept={ACCEPTED_IMAGES}
              multiple
              disabled={busy}
              labels={{
                title: 'Drop press-kit photos here',
                description: 'JPEG, PNG, or WebP · up to 30 photos',
                browse: 'Choose photos',
                selected: 'Ready to upload',
              }}
              onFiles={(files) => {
                setSelectedGalleryFiles(Array.from(files));
                void uploadGallery(files, true);
              }}
            />
            {images.length === 0 ? (
              <p className="text-foreground-secondary mt-3 text-sm">
                Your press kit is empty. Add a bio and at least one photo to
                enable the download.
              </p>
            ) : null}
          </StudioPanel>
          <StudioPanel
            title="Press kit images"
            description={`${pressImages.length} of ${MAX_PRESS_KIT_SELECTED_IMAGES} press kit images · selecting another automatically drops the oldest selection`}
          >
            {images.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                Add images in the Gallery tab first.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <li
                    key={image.id}
                    draggable
                    onDragStart={() => setDraggedPressKitImageId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggedPressKitImageId) {
                        void reorderPressKitImages(
                          draggedPressKitImageId,
                          image.id,
                        );
                      }
                      setDraggedPressKitImageId(null);
                    }}
                    onDragEnd={() => setDraggedPressKitImageId(null)}
                    className="border-border bg-background-secondary overflow-hidden rounded-lg border"
                  >
                    <img
                      src={image.imageUrl}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="flex flex-col gap-2 p-3">
                      <Input
                        aria-label={`Title for image ${image.position + 1}`}
                        value={image.title ?? ''}
                        placeholder="Photo title or credit"
                        onChange={(event) => {
                          const title = event.target.value;
                          setImages((current) =>
                            current.map((candidate) =>
                              candidate.id === image.id
                                ? { ...candidate, title }
                                : candidate,
                            ),
                          );
                        }}
                        onBlur={(event) =>
                          void updatePressKitImage(image.id, {
                            title: event.target.value.trim() || null,
                          })
                        }
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs">Include in press kit</span>
                        <div className="flex items-center gap-2">
                          <Toggle
                            label={`Include ${image.title || `image ${image.position + 1}`} in press kit`}
                            checked={image.includeInZip}
                            onChange={() => void togglePressKitImage(image)}
                          />
                          <Tooltip content="Remove image" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label="Remove image from gallery"
                              onClick={() => void removeImage(image.id)}
                            >
                              <Trash2Icon size={14} aria-hidden />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </StudioPanel>
          <StudioPanel
            title="Press kit preview"
            description="What a promoter sees when opening your press kit."
          >
            <PressKitPreview
              displayName={
                profile?.displayName ?? user?.displayName ?? 'Artist'
              }
              bio={pressKit?.bioShort ?? null}
              images={pressImages}
            />
          </StudioPanel>
        </>
      ) : null}
      {avatarViewerOpen && avatarUrl ? (
        <ImageLightbox
          images={[{ imageUrl: avatarUrl }]}
          index={0}
          label={`${profile?.displayName ?? 'Artist'} profile picture`}
          onClose={() => setAvatarViewerOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        isOpen={pendingReplaceUpload !== null}
        title={`Replace all ${images.length} existing gallery images?`}
        description="This upload replaces every current gallery photo."
        confirmLabel="Replace"
        onCancel={() => setPendingReplaceUpload(null)}
        onConfirm={() => {
          const pending = pendingReplaceUpload;
          setPendingReplaceUpload(null);
          if (!pending) {
            return;
          }
          void applyGalleryUpload(pending.files, pending.includeInZip);
        }}
      />
    </div>
  );
};

function PressKitPreview({
  displayName,
  bio,
  images,
}: {
  displayName: string;
  bio: string | null;
  images: PressKitImageItem[];
}) {
  return (
    <div className="border-border bg-background overflow-hidden rounded-xl border shadow-lg">
      <div className="via-primary/30 relative min-h-48 overflow-hidden bg-gradient-to-br from-black/80 to-black/80 p-5 text-white sm:min-h-56">
        {images[0] ? (
          <img
            src={images[0].imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <h3 className="font-display relative mt-24 text-2xl font-extrabold tracking-tight sm:mt-32">
          {displayName}
        </h3>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <p
          className={`text-sm leading-relaxed ${bio ? 'text-foreground' : 'text-foreground-secondary italic'}`}
        >
          {bio || 'No bio yet.'}
        </p>
        {images.length > 1 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {images.slice(1, 5).map((image) => (
              <img
                key={image.id}
                src={image.imageUrl}
                alt={image.title ?? ''}
                className="aspect-square w-full rounded-md object-cover"
              />
            ))}
          </div>
        ) : null}
        {images.length === 0 ? (
          <p className="text-foreground-secondary text-xs">
            Add at least one included image to complete the preview.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const StudioBrandingView: FC = () => {
  const profile = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const section = isStudioBrandingSection(search.tab) ? search.tab : 'branding';

  return (
    <StudioGate>
      <div
        className={`studio-page-layout mx-auto flex flex-col gap-6 px-1 py-2 ${
          section === 'channel-designer' ? 'w-full max-w-none' : 'max-w-5xl'
        }`}
      >
        <StudioNav current="/studio/branding" />
        <ViewShell
          title="Branding"
          subtitle="Shape your visual identity, keep a public image gallery, assemble a press kit, and design the public channel."
          classes={{ root: 'px-0 pt-0' }}
        >
          {profile ? (
            <Link to="/u/$username" params={{ username: profile.username }}>
              <Button size="sm" variant="secondary">
                <EyeIcon size={15} aria-hidden className="mr-1.5" />
                View public profile
              </Button>
            </Link>
          ) : null}
          <StudioBrandingPanel
            section={section}
            hideSectionNav={false}
            onSectionChange={(next) => {
              void navigate({
                to: '/studio/branding',
                search: { tab: next === 'branding' ? undefined : next },
              });
            }}
          />
        </ViewShell>
      </div>
    </StudioGate>
  );
};
