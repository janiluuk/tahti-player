import { UploadCloudIcon, XIcon } from 'lucide-react';
import { useState, type FC } from 'react';

import { Button, Dialog, FilePicker, Tooltip } from '@tahti-player/ui';

import {
  updatePressKitImage,
  uploadPressKitImage,
  uploadProfileAvatar,
  type PressKitImageItem,
} from '../api/artist-settings';

type ImagePurpose = 'profile' | 'gallery' | 'press-kit';

type PendingImage = {
  id: string;
  file: File;
  purpose: ImagePurpose;
  previewUrl: string;
};

type Props = {
  avatarUrl?: string | null;
  displayName: string;
  onProfileUploaded: (url: string) => void;
  onGalleryUploaded?: (image: PressKitImageItem) => void;
};

const PURPOSES: Array<{
  id: ImagePurpose;
  label: string;
  description: string;
}> = [
  {
    id: 'profile',
    label: 'Profile image',
    description: 'The main artist image shown with your identity.',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    description: 'A public image for your artist page gallery.',
  },
  {
    id: 'press-kit',
    label: 'Press kit',
    description: 'Include this image in your downloadable press kit.',
  },
];

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp';

function purposeDescription(purpose: ImagePurpose): string {
  return PURPOSES.find((option) => option.id === purpose)?.description ?? '';
}

export const ArtistImagePurposePicker: FC<Props> = ({
  avatarUrl,
  displayName,
  onProfileUploaded,
  onGalleryUploaded,
}) => {
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    setError(null);
    setPending((current) => {
      const next = [
        ...current,
        ...files.map((file, index) => ({
          id: `${file.name}-${file.lastModified}-${current.length + index}`,
          file,
          purpose: 'gallery' as const,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
      return next.map((image, index) =>
        index === 0 && current.length === 0
          ? { ...image, purpose: 'profile' }
          : image,
      );
    });
  };

  const setPurpose = (id: string, purpose: ImagePurpose) => {
    setPending((current) =>
      current.map((image) => {
        if (image.id === id) {
          return { ...image, purpose };
        }
        if (purpose === 'profile' && image.purpose === 'profile') {
          return { ...image, purpose: 'gallery' };
        }
        return image;
      }),
    );
  };

  const remove = (id: string) => {
    setPending((current) => current.filter((image) => image.id !== id));
  };

  const upload = async () => {
    if (pending.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    const errors: string[] = [];
    for (const image of pending) {
      if (image.purpose === 'profile') {
        const result = await uploadProfileAvatar(image.file);
        if (result.ok) {
          onProfileUploaded(result.avatarUrl);
        } else {
          errors.push(`${image.file.name}: ${result.error}`);
        }
        continue;
      }
      const result = await uploadPressKitImage(image.file);
      if (!result.ok) {
        errors.push(`${image.file.name}: ${result.error}`);
        continue;
      }
      const updated = await updatePressKitImage(result.image.id, {
        includeInZip: image.purpose === 'press-kit',
      });
      if (!updated.ok) {
        errors.push(`${image.file.name}: ${updated.error}`);
        continue;
      }
      onGalleryUploaded?.(updated.data);
    }
    setBusy(false);
    if (errors.length > 0) {
      setError(errors.join('; '));
      return;
    }
    setPending([]);
  };

  return (
    <>
      <div className="group relative inline-flex">
        <div className="border-border bg-background-secondary flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 text-xl font-bold">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            displayName.slice(0, 1).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Change profile image"
          title="Change profile image"
          className="bg-background/80 text-foreground absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <UploadCloudIcon size={20} aria-hidden />
        </button>
      </div>

      <Dialog.Root
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        className="max-w-lg"
      >
        <Dialog.Title>Add profile images</Dialog.Title>
        <Dialog.Description>
          Drop one or more images here. You’ll choose what each image is for
          before anything is uploaded.
        </Dialog.Description>
        <div className="mt-4">
          <FilePicker
            labels={{
              title: 'Artist images',
              description: 'JPEG, PNG, or WebP',
              browse: 'Choose images',
            }}
            accept={ACCEPTED_IMAGES}
            multiple
            selectedFiles={pending.map((image) => image.file)}
            onFiles={(files) => {
              addFiles(Array.from(files));
              setPickerOpen(false);
            }}
          />
        </div>
      </Dialog.Root>

      <Dialog.Root
        isOpen={pending.length > 0}
        onClose={() => {
          if (!busy) {
            setPending([]);
          }
        }}
        className="max-w-3xl"
      >
        <Dialog.Title>Choose what each image is for</Dialog.Title>
        <Dialog.Description>
          Set a purpose for every image. Only one image can be the profile
          image; selecting another moves the previous one to Gallery.
        </Dialog.Description>
        <div className="mt-5 flex flex-col gap-4">
          {pending.map((image) => (
            <article
              key={image.id}
              className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row"
            >
              <img
                src={image.previewUrl}
                alt=""
                className="size-24 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {image.file.name}
                </p>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {purposeDescription(image.purpose)}
                </p>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-3"
                  role="radiogroup"
                >
                  {PURPOSES.map((purpose) => (
                    <button
                      key={purpose.id}
                      type="button"
                      role="radio"
                      aria-checked={image.purpose === purpose.id}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        image.purpose === purpose.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground-secondary hover:text-foreground'
                      }`}
                      onClick={() => setPurpose(image.id, purpose.id)}
                    >
                      <span className="block font-semibold">
                        {purpose.label}
                      </span>
                      <span className="mt-1 block opacity-80">
                        {purpose.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <Tooltip content="Remove image" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Remove ${image.file.name}`}
                  onClick={() => remove(image.id)}
                  disabled={busy}
                >
                  <XIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </article>
          ))}
        </div>
        {error ? <p className="text-accent-red mt-3 text-sm">{error}</p> : null}
        <Dialog.Actions>
          <Button
            variant="secondary"
            onClick={() => setPending([])}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={() => void upload()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload images'}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};
