import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FilePicker, Input, SaveButton } from '@tahti-player/ui';

import { fetchStreamOverlay, patchStreamOverlay } from '../api/broadcast';
import { uploadUserMediaFile } from '../api/user-media';

/** RTMP mirrors carry no title metadata, so every multistream push bakes in
 * a static video frame built from this title/subtitle/cover — shared across
 * every RTMP target on the channel, not per-destination. Used both from the
 * Go Live stream manager (StreamManagerPanel) and from Manage → Multicast →
 * Overlay, so it owns its own fetch/save rather than taking props for it. */
export function StreamOverlayEditor({ onSaved }: { onSaved?: () => void }) {
  const [overlay, setOverlay] = useState({
    streamOverlayTitle: '',
    streamOverlaySubtitle: '',
    streamOverlayCoverUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchStreamOverlay().then((result) => {
      setOverlay({
        streamOverlayTitle: result.data.streamOverlayTitle ?? '',
        streamOverlaySubtitle: result.data.streamOverlaySubtitle ?? '',
        streamOverlayCoverUrl: result.data.streamOverlayCoverUrl ?? '',
      });
      setCoverFile(null);
    });
  }, []);

  const save = () => {
    setSaving(true);
    setError(null);
    void patchStreamOverlay({
      streamOverlayTitle: overlay.streamOverlayTitle.trim(),
      streamOverlaySubtitle: overlay.streamOverlaySubtitle.trim(),
      streamOverlayCoverUrl: overlay.streamOverlayCoverUrl.trim(),
    }).then((result) => {
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved?.();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        RTMP has no built-in title metadata, so YouTube/Twitch/etc. mirrors
        carry a static video frame with this text and cover baked in. Leave
        blank to use your display name and avatar.
      </p>
      {error && (
        <p className="text-accent-red text-sm" role="alert">
          {error}
        </p>
      )}
      <Input
        label="Overlay title"
        placeholder="Your display name"
        maxLength={80}
        value={overlay.streamOverlayTitle}
        onChange={(event) =>
          setOverlay({ ...overlay, streamOverlayTitle: event.target.value })
        }
      />
      <Input
        label="Overlay subtitle"
        placeholder="e.g. Every Friday, 8pm CET"
        maxLength={120}
        value={overlay.streamOverlaySubtitle}
        onChange={(event) =>
          setOverlay({
            ...overlay,
            streamOverlaySubtitle: event.target.value,
          })
        }
      />
      {overlay.streamOverlayCoverUrl ? (
        <img
          src={overlay.streamOverlayCoverUrl}
          alt="Overlay cover preview"
          className="border-border h-20 w-20 rounded-md border object-cover"
        />
      ) : null}
      <FilePicker
        labels={{
          title: 'Overlay cover image',
          description: 'JPEG, PNG, or WebP',
          browse: coverUploading
            ? 'Uploading…'
            : coverFile
              ? 'Choose another image'
              : 'Choose image',
        }}
        accept="image/jpeg,image/png,image/webp"
        selectedFiles={coverFile ? [coverFile] : []}
        disabled={coverUploading}
        onFiles={(files) => {
          const file = files[0];
          if (!file) {
            return;
          }
          setCoverFile(file);
          setCoverUploading(true);
          setError(null);
          void uploadUserMediaFile(file).then((result) => {
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
          });
        }}
      />
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
