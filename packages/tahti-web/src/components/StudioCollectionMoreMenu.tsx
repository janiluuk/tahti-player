import { useNavigate } from '@tanstack/react-router';
import { MoreVerticalIcon, Share2Icon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Popover, Tooltip } from '@tahti-player/ui';

import { deleteStudioCollection } from '../api/studio';
import type { StudioCollection } from '../api/studio-types';
import { ConfirmDialog } from './ConfirmDialog';

/** "⋮" more-options menu shared by the Collection and Playlist editors —
 * both edit the same `StudioCollection` entity via the same delete
 * endpoint. Export is client-side JSON (no export API exists). */
export function StudioCollectionMoreMenu({
  col,
  kindLabel,
}: {
  col: StudioCollection;
  /** e.g. "collection", "playlist", "DJ set" — used in labels/toasts. */
  kindLabel: string;
}) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      void navigate({ to: '/studio/collections' });
    });
  };

  return (
    <>
      <Popover
        className="relative"
        anchor="bottom end"
        trigger={
          <Tooltip content="More options" side="top">
            <Button
              variant="secondary"
              size="icon"
              aria-label={`More options for ${kindLabel}`}
            >
              <MoreVerticalIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        }
        panelClassName="min-w-48"
      >
        <Popover.Menu>
          <Popover.Item icon={<Share2Icon size={16} />} onClick={exportAsJson}>
            Export as JSON
          </Popover.Item>
          <Popover.Item
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
