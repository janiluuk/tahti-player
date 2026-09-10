import { PinIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  deletePinnedAnnouncement,
  fetchPinnedAnnouncements,
  postPinnedAnnouncement,
  type PinnedAnnouncement,
} from '../api/announcements';
import { ConfirmDialog } from './ConfirmDialog';
import { StudioPanel } from './StudioPanel';

export function PinnedAnnouncementsPanel({ slug }: { slug: string }) {
  const [items, setItems] = useState<PinnedAnnouncement[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<PinnedAnnouncement | null>(
    null,
  );

  const reload = () => {
    void fetchPinnedAnnouncements(slug).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(reload, [slug]);

  const publish = async () => {
    const text = body.trim();
    if (!text) {
      return;
    }
    setBusy(true);
    const result = await postPinnedAnnouncement(text);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setBody('');
    setItems((current) => [result.announcement, ...current].slice(0, 3));
    toast.success('Announcement pinned.');
  };

  const remove = async (item: PinnedAnnouncement) => {
    const result = await deletePinnedAnnouncement(item.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return (
    <StudioPanel
      title="Pinned announcements"
      description="Short messages shown above chat on your channel. Keep up to three current announcements."
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            label=""
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write an announcement…"
          />
          <Tooltip content="Pin announcement" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label="Pin announcement"
              disabled={busy || !body.trim()}
              onClick={() => void publish()}
            >
              <SendIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        </div>
        {loading ? (
          <p className="text-foreground-secondary text-sm">
            Loading announcements…
          </p>
        ) : items.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            No pinned announcements yet.
          </p>
        ) : (
          <ul className="border-border divide-border divide-y rounded-lg border">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-3">
                <PinIcon
                  size={16}
                  className="text-accent-orange mt-0.5 shrink-0"
                  aria-hidden
                />
                <p className="min-w-0 flex-1 text-sm">{item.body}</p>
                <Tooltip content={`Delete ${item.body}`} side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Delete ${item.body}`}
                    onClick={() => setPendingRemove(item)}
                  >
                    <Trash2Icon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={
          pendingRemove
            ? `Remove “${pendingRemove.body}”?`
            : 'Remove announcement?'
        }
        description="The announcement is unpinned from your channel."
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const item = pendingRemove;
          setPendingRemove(null);
          if (!item) {
            return;
          }
          void remove(item);
        }}
      />
    </StudioPanel>
  );
}
