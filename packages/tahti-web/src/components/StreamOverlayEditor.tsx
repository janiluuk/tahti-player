import { ImageIcon, UploadCloudIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  FilePicker,
  Input,
  SaveButton,
  Toggle,
} from '@tahti-player/ui';

import { fetchStreamOverlay, patchStreamOverlay } from '../api/broadcast';
import { uploadUserMediaFile } from '../api/user-media';
import { HelpLayer } from './HelpLayer';
import { ImageSlotDeleteBadge } from './imageSlot/ImageSlotDeleteBadge';
import { ImageSlotPreviewDialog } from './imageSlot/ImageSlotPreviewDialog';
import { useImageSlotChrome } from './imageSlot/useImageSlotChrome';

/** The composited 1280×720 video frame's text placement (see
 * buildRtmpMirrorOutput in the sibling orchestrator) — title near the
 * bottom in white, subtitle just below it, smaller and lighter. Mirrored
 * here as a CSS overlay so the preview matches the real render. */
function OverlayTextPreview({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-8 pb-2">
      {title ? (
        <p className="truncate text-sm leading-tight font-bold text-white">
          {title}
        </p>
      ) : null}
      {subtitle ? (
        <p className="truncate text-xs leading-tight text-slate-300">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** RTMP mirrors carry no title metadata, so every multistream push bakes in
 * a static video frame built from this title/subtitle/cover — shared across
 * every RTMP target on the channel, not per-destination. Used both from the
 * Go Live stream manager (StreamManagerPanel) and from Manage → Multicast →
 * Overlay, so it owns its own fetch/save rather than taking props for it. */
export function StreamOverlayEditor({ onSaved }: { onSaved?: () => void }) {
  const [overlay, setOverlay] = useState({
    streamOverlayTitle: '',
    streamOverlaySubtitle: '',
    streamOverlayShowTitle: false,
    streamOverlayCoverUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [coverUploadOpen, setCoverUploadOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverChrome = useImageSlotChrome({
    onClear: () =>
      setOverlay((current) => ({ ...current, streamOverlayCoverUrl: '' })),
  });

  useEffect(() => {
    void fetchStreamOverlay().then((result) => {
      setOverlay({
        streamOverlayTitle: result.data.streamOverlayTitle ?? '',
        streamOverlaySubtitle: result.data.streamOverlaySubtitle ?? '',
        streamOverlayShowTitle: result.data.streamOverlayShowTitle,
        streamOverlayCoverUrl: result.data.streamOverlayCoverUrl ?? '',
      });
    });
  }, []);

  const save = () => {
    setSaving(true);
    setError(null);
    void patchStreamOverlay({
      streamOverlayTitle: overlay.streamOverlayTitle.trim(),
      streamOverlaySubtitle: overlay.streamOverlaySubtitle.trim(),
      streamOverlayShowTitle: overlay.streamOverlayShowTitle,
      streamOverlayCoverUrl: overlay.streamOverlayCoverUrl.trim(),
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success('Overlay saved.');
      onSaved?.();
    });
  };

  const uploadCover = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setCoverUploading(true);
    setError(null);
    const result = await uploadUserMediaFile(file);
    setCoverUploading(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    setOverlay((current) => ({
      ...current,
      streamOverlayCoverUrl: result.data.url,
    }));
    toast.success('Overlay cover updated.');
    setCoverUploadOpen(false);
  };

  const showText = overlay.streamOverlayShowTitle;
  const hasOverlayText =
    overlay.streamOverlayTitle.trim() || overlay.streamOverlaySubtitle.trim();

  return (
    <div className="flex flex-col gap-4">
      <HelpLayer title="How the stream overlay works">
        <p>
          RTMP has no built-in title metadata, so YouTube/Twitch/etc. mirrors
          carry a static video frame with this cover baked in. Leave the cover
          blank to use your avatar.
        </p>
      </HelpLayer>
      {error && (
        <p className="text-accent-red text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="group relative aspect-video w-full max-w-xs">
        <button
          type="button"
          onClick={() =>
            !coverUploading &&
            (overlay.streamOverlayCoverUrl
              ? coverChrome.openPreview()
              : setCoverUploadOpen(true))
          }
          disabled={coverUploading}
          aria-label={
            overlay.streamOverlayCoverUrl
              ? 'Preview overlay cover'
              : 'Change overlay cover'
          }
          title={
            overlay.streamOverlayCoverUrl
              ? 'Preview overlay cover'
              : 'Change overlay cover'
          }
          className="border-border bg-background-secondary relative flex size-full items-center justify-center overflow-hidden rounded-xl border"
        >
          {overlay.streamOverlayCoverUrl ? (
            <img
              src={overlay.streamOverlayCoverUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon
              size={28}
              aria-hidden
              className="text-foreground-secondary"
            />
          )}
          {overlay.streamOverlayCoverUrl ? null : (
            <div className="bg-background/80 text-foreground pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <UploadCloudIcon size={22} aria-hidden />
            </div>
          )}
          {showText && hasOverlayText ? (
            <OverlayTextPreview
              title={overlay.streamOverlayTitle}
              subtitle={overlay.streamOverlaySubtitle}
            />
          ) : null}
        </button>
        {overlay.streamOverlayCoverUrl ? (
          <ImageSlotDeleteBadge
            label="overlay cover"
            onClick={coverChrome.requestDelete}
          />
        ) : null}
      </div>

      <ImageSlotPreviewDialog
        isOpen={coverChrome.previewOpen}
        onClose={coverChrome.closePreview}
        label="Overlay cover"
        src={overlay.streamOverlayCoverUrl}
        onChangeClick={() => {
          coverChrome.closePreview();
          setCoverUploadOpen(true);
        }}
        confirmOpen={coverChrome.confirmOpen}
        clearing={coverChrome.clearing}
        onRequestDelete={coverChrome.requestDelete}
        onCancelDelete={coverChrome.cancelDelete}
        onConfirmDelete={coverChrome.confirmDelete}
      />

      <Dialog.Root
        isOpen={coverUploadOpen}
        onClose={() => {
          if (!coverUploading) {
            setCoverUploadOpen(false);
          }
        }}
        className="max-w-md"
      >
        <Dialog.Title>Overlay cover</Dialog.Title>
        <Dialog.Description>
          Wide JPEG, PNG, or WebP. Uploads immediately once selected.
        </Dialog.Description>
        <div className="mt-4">
          <FilePicker
            labels={{
              title: 'Overlay cover image',
              description: 'JPEG, PNG, or WebP',
              browse: coverUploading ? 'Uploading…' : 'Choose image',
            }}
            accept="image/jpeg,image/png,image/webp"
            selectedFiles={[]}
            disabled={coverUploading}
            onFiles={(files) => void uploadCover(files)}
          />
        </div>
      </Dialog.Root>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Show overlay title</p>
          <p className="text-foreground-secondary text-xs">
            Bake a title and subtitle onto the video frame.
          </p>
        </div>
        <Toggle
          label="Show overlay title"
          checked={overlay.streamOverlayShowTitle}
          onChange={(checked) =>
            setOverlay((current) => ({
              ...current,
              streamOverlayShowTitle: checked,
            }))
          }
        />
      </div>

      {overlay.streamOverlayShowTitle ? (
        <>
          <Input
            label="Overlay title"
            placeholder="Your display name"
            maxLength={80}
            value={overlay.streamOverlayTitle}
            onChange={(event) =>
              setOverlay((current) => ({
                ...current,
                streamOverlayTitle: event.target.value,
              }))
            }
          />
          <Input
            label="Overlay subtitle"
            placeholder="e.g. Every Friday, 8pm CET"
            maxLength={120}
            value={overlay.streamOverlaySubtitle}
            onChange={(event) =>
              setOverlay((current) => ({
                ...current,
                streamOverlaySubtitle: event.target.value,
              }))
            }
          />
        </>
      ) : null}

      <SaveButton
        disabled={coverUploading}
        saving={saving}
        label="Save overlay"
        onClick={save}
        className="self-start"
      />
    </div>
  );
}
