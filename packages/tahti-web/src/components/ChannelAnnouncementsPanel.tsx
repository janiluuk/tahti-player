import { PlayIcon, ScissorsIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, FilePicker, Toggle, Tooltip } from '@tahti-player/ui';

import {
  deleteAnnouncementClip,
  fetchAnnouncementClips,
  fetchAnnouncementPreview,
  patchAnnouncementClip,
  renderAnnouncementTrim,
  setProfileBackgroundClip,
  uploadAnnouncementClip,
  type AnnouncementClip,
  type AnnouncementTrim,
} from '../api/announcements';
import { usePolling } from '../hooks/usePolling';
import { AnnouncementTrimDialog } from './AnnouncementTrimDialog';
import { ConfirmDialog } from './ConfirmDialog';

const formatDuration = (seconds: number | null) => {
  if (seconds == null) {
    return '—';
  }
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const RENDER_POLL_MS = 5_000;

export function ChannelAnnouncementsPanel() {
  const [clips, setClips] = useState<AnnouncementClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AnnouncementClip | null>(
    null,
  );
  const [trimClip, setTrimClip] = useState<AnnouncementClip | null>(null);
  const [trimming, setTrimming] = useState(false);

  const reload = () => {
    void fetchAnnouncementClips().then((result) => {
      setClips(result.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);
  usePolling(
    reload,
    RENDER_POLL_MS,
    clips.some((clip) => clip.renderStatus === 'PROCESSING'),
  );

  const trim = async (clip: AnnouncementClip, values: AnnouncementTrim) => {
    setTrimming(true);
    const result = await renderAnnouncementTrim(clip.id, values);
    setTrimming(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTrimClip(null);
    setClips((current) =>
      current.map((item) =>
        item.id === clip.id
          ? { ...item, renderStatus: result.renderStatus }
          : item,
      ),
    );
    toast.success('Trimming — the clip updates when it is done.');
  };

  const toggle = (clip: AnnouncementClip) => {
    const next = !clip.isEnabled;
    setClips((current) =>
      current.map((item) =>
        item.id === clip.id ? { ...item, isEnabled: next } : item,
      ),
    );
    void patchAnnouncementClip(clip.id, { isEnabled: next }).then((result) => {
      if (!result.ok) {
        setClips((current) =>
          current.map((item) =>
            item.id === clip.id ? { ...item, isEnabled: !next } : item,
          ),
        );
        toast.error(result.error);
      }
    });
  };

  const preview = async (clip: AnnouncementClip) => {
    if (previewId === clip.id) {
      setPreviewId(null);
      setPreviewUrl(null);
      return;
    }
    setPreviewId(clip.id);
    setPreviewUrl(null);
    const result = await fetchAnnouncementPreview(clip.id);
    if (!result.ok) {
      setPreviewId(null);
      toast.error(result.error);
      return;
    }
    setPreviewUrl(result.url);
  };

  const setPageMusic = async (clip: AnnouncementClip) => {
    const nextId = clip.isProfileBackground ? null : clip.id;
    const result = await setProfileBackgroundClip(nextId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setClips((current) =>
      current.map((item) => ({
        ...item,
        isProfileBackground: nextId != null && item.id === nextId,
      })),
    );
    toast.success(nextId ? 'Page music enabled.' : 'Page music disabled.');
  };

  const remove = async (clip: AnnouncementClip) => {
    const result = await deleteAnnouncementClip(clip.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setClips((current) => current.filter((item) => item.id !== clip.id));
    if (previewId === clip.id) {
      setPreviewId(null);
      setPreviewUrl(null);
    }
  };

  return (
    <section className="border-border bg-background-secondary/40 flex flex-col gap-5 rounded-xl border p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Station announcements
        </h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Upload short station IDs, shoutouts, or interstitials for your 24/7
          rotation. Enable them here, then turn the rotation switch on in the
          24/7 tab.
        </p>
      </div>
      <FilePicker
        accept="audio/*"
        disabled={uploading}
        labels={{
          title: uploading ? 'Uploading announcement…' : 'Announcement audio',
          description: 'Choose a short MP3, WAV, FLAC, or AIFF clip.',
          browse: uploading ? 'Uploading…' : 'Choose audio',
        }}
        onFiles={(files) => {
          const file = files[0];
          if (!file) {
            return;
          }
          setUploading(true);
          void uploadAnnouncementClip(file).then((result) => {
            setUploading(false);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setClips((current) => [result.clip, ...current]);
            toast.success('Announcement uploaded.');
          });
        }}
      />
      {loading ? (
        <p className="text-foreground-secondary text-sm">
          Loading announcements…
        </p>
      ) : clips.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No announcement clips yet.
        </p>
      ) : (
        <ul className="border-border divide-border divide-y rounded-lg border">
          {clips.map((clip) => (
            <li key={clip.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-40 flex-1">
                <div className="text-sm font-semibold">{clip.title}</div>
                <div className="text-foreground-secondary text-xs">
                  {formatDuration(clip.durationSec)} ·{' '}
                  {clip.renderStatus.toLowerCase()}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Toggle
                  checked={clip.isEnabled}
                  onChange={() => toggle(clip)}
                  aria-label={`Enable ${clip.title}`}
                />
                {clip.isEnabled ? 'On' : 'Off'}
              </label>
              <Tooltip content="Preview" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Preview ${clip.title}`}
                  onClick={() => void preview(clip)}
                >
                  <PlayIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Button
                size="sm"
                variant={clip.isProfileBackground ? undefined : 'secondary'}
                disabled={clip.renderStatus !== 'READY'}
                onClick={() => void setPageMusic(clip)}
              >
                {clip.isProfileBackground
                  ? 'Page music on'
                  : 'Use as page music'}
              </Button>
              <Tooltip content="Trim" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Trim ${clip.title}`}
                  disabled={clip.renderStatus === 'PROCESSING'}
                  onClick={() => setTrimClip(clip)}
                >
                  <ScissorsIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
              <Tooltip content="Delete" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Delete ${clip.title}`}
                  onClick={() => setPendingDelete(clip)}
                >
                  <Trash2Icon size={16} aria-hidden />
                </Button>
              </Tooltip>
              {previewId === clip.id && previewUrl ? (
                <audio
                  src={previewUrl}
                  controls
                  autoPlay
                  className="basis-full"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <AnnouncementTrimDialog
        clip={trimClip}
        busy={trimming}
        onClose={() => setTrimClip(null)}
        onSubmit={(clip, values) => void trim(clip, values)}
      />
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={
          pendingDelete ? `Delete “${pendingDelete.title}”?` : 'Delete clip?'
        }
        description="This removes the announcement from your station rotation."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const clip = pendingDelete;
          setPendingDelete(null);
          if (clip) {
            void remove(clip);
          }
        }}
      />
    </section>
  );
}
