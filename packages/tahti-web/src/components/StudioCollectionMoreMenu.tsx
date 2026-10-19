import { useNavigate } from '@tanstack/react-router';
import {
  GlobeIcon,
  LockIcon,
  MoreVerticalIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Popover } from '@tahti-player/ui';

import { deleteStudioCollection, patchStudioCollection } from '../api/studio';
import type { StudioCollection } from '../api/studio-types';
import { ConfirmDialog } from './ConfirmDialog';

/** "⋮" more-options menu shared by the Collection and Playlist editors —
 * both edit the same `StudioCollection` entity via the same delete
 * endpoint. Export is client-side JSON (no export API exists). The
 * Collections list reuses it per row with `onDeleted` / `onChanged`. */
export function StudioCollectionMoreMenu({
  col,
  kindLabel,
  onDeleted,
  onChanged,
}: {
  col: StudioCollection;
  /** e.g. "collection", "playlist", "DJ set" — used in labels/toasts. */
  kindLabel: string;
  /** Replaces the default "go back to /studio/collections" after a delete. */
  onDeleted?: () => void;
  /** Shows a public/private switch and receives the saved collection. */
  onChanged?: (col: StudioCollection) => void;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isPrivate =
    (col.visibility ?? (col.isPublic === false ? 'PRIVATE' : 'PUBLIC')) ===
    'PRIVATE';

  const toggleVisibility = () => {
    const visibility = isPrivate ? 'PUBLIC' : 'PRIVATE';
    void patchStudioCollection(col.slug, {
      visibility,
      isPublic: visibility === 'PUBLIC',
    }).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChanged?.(result.data);
      toast.success(
        visibility === 'PUBLIC'
          ? `“${col.name}” is public.`
          : `“${col.name}” is private.`,
      );
    });
  };

  const exportAsJson = () => {
    const payload = {
      name: col.name,
      description: col.description ?? null,
      style: col.style ?? col.type ?? null,
      items: (col.items ?? []).map((item) => ({
        title: item.sound?.title ?? item.release?.title ?? item.id,
        durationSec: item.sound?.durationSec ?? null,
        soundId: item.soundId ?? null,
        releaseId: item.releaseId ?? null,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${col.slug || 'collection'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = () => {
    if (deleting) {
      return;
    }
    setDeleting(true);
    void deleteStudioCollection(col.slug).then((result) => {
      if (!result.ok) {
        setDeleting(false);
        toast.error(result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success(
        `${kindLabel.charAt(0).toUpperCase()}${kindLabel.slice(1)} deleted.`,
      );
      if (onDeleted) {
        onDeleted();
      } else {
        void navigate({ to: '/studio/collections' });
      }
    });
  };

  return (
    <>
      <Popover
        anchor="bottom end"
        tooltip={{ content: 'More options', side: 'top' }}
        trigger={
          <Button
            variant="secondary"
            size="icon"
            aria-label={
              onDeleted
                ? `More options for ${col.name}`
                : `More options for ${kindLabel}`
            }
          >
            <MoreVerticalIcon size={16} aria-hidden />
          </Button>
        }
        panelClassName="min-w-48"
      >
        <Popover.Menu>
          {onChanged ? (
            <Popover.Item
              closeOnClick
              icon={
                isPrivate ? <GlobeIcon size={16} /> : <LockIcon size={16} />
              }
              onClick={toggleVisibility}
            >
              {isPrivate ? 'Make public' : 'Make private'}
            </Popover.Item>
          ) : null}
          {col.items ? (
            <Popover.Item
              closeOnClick
              icon={<Share2Icon size={16} />}
              onClick={exportAsJson}
            >
              Export as JSON
            </Popover.Item>
          ) : null}
          <Popover.Item
            closeOnClick
            intent="danger"
            icon={<Trash2Icon size={16} />}
            onClick={() => setConfirmOpen(true)}
          >
            Delete {kindLabel}
          </Popover.Item>
        </Popover.Menu>
      </Popover>
      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Delete "${col.name}"?`}
        description={`This permanently deletes the ${kindLabel} and its track list. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
