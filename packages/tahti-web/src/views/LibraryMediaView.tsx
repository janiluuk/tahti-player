import { ImageIcon, PlayIcon, Trash2Icon, VideoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, ImageReveal, Tooltip } from '@tahti-player/ui';

import {
  deleteUserMedia,
  fetchUserMedia,
  type UserMediaFile,
} from '../api/user-media';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StudioPanel } from '../components/StudioPanel';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibraryMediaView() {
  const [files, setFiles] = useState<UserMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemove, setPendingRemove] = useState<UserMediaFile | null>(
    null,
  );

  const reload = async () => {
    setLoading(true);
    const result = await fetchUserMedia();
    setFiles(result.data);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
  }, []);

  const remove = async (file: UserMediaFile) => {
    const previous = files;
    setFiles((current) => current.filter((item) => item.id !== file.id));
    const result = await deleteUserMedia(file.id);
    if (!result.ok) {
      setFiles(previous);
      toast.error(result.error);
      return;
    }
    toast.success('Media file removed.');
  };

  return (
    <StudioPanel
      title="Media files"
      description="Background images and videos stored in your Cloudflare R2 media library."
    >
      {loading ? (
        <p className="text-foreground-secondary text-sm">Loading media…</p>
      ) : files.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No media files yet. Add background images or a Video loop backdrop
          from Artist → Branding.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const isVideo = file.contentType.startsWith('video/');
            return (
              <article
                key={file.id}
                className="border-border overflow-hidden rounded-lg border"
              >
                <div className="bg-background-secondary relative aspect-video">
                  {isVideo ? (
                    <video
                      src={file.url}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageReveal
                      src={file.url}
                      alt=""
                      className="h-full w-full"
                    />
                  )}
                  <Badge
                    variant="pill"
                    color="secondary"
                    className="bg-background/80 absolute top-2 left-2 text-[10px] uppercase backdrop-blur-sm"
                  >
                    {isVideo ? (
                      <VideoIcon
                        size={12}
                        className="mr-1 inline"
                        aria-hidden
                      />
                    ) : (
                      <ImageIcon
                        size={12}
                        className="mr-1 inline"
                        aria-hidden
                      />
                    )}
                    {isVideo ? 'Video' : 'Image'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {file.filename}
                    </p>
                    <p className="text-foreground-secondary text-xs">
                      {formatBytes(file.sizeBytes)}
                    </p>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${file.filename}`}
                    title="Open preview"
                    className="text-foreground-secondary hover:text-foreground"
                  >
                    <PlayIcon size={16} aria-hidden />
                  </a>
                  <Tooltip content={`Remove ${file.filename}`} side="top">
                    <Button
                      size="icon-sm"
                      variant="text"
                      aria-label={`Remove ${file.filename}`}
                      onClick={() => setPendingRemove(file)}
                    >
                      <Trash2Icon
                        size={16}
                        className="text-accent-red-strong"
                        aria-hidden
                      />
                    </Button>
                  </Tooltip>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={
          pendingRemove
            ? `Remove ${pendingRemove.filename} from your media files?`
            : 'Remove media file?'
        }
        description="The file is deleted from your media library."
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const file = pendingRemove;
          setPendingRemove(null);
          if (!file) {
            return;
          }
          void remove(file);
        }}
      />
    </StudioPanel>
  );
}
