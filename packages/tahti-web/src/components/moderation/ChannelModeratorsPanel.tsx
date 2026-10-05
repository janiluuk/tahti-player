import { Trash2Icon, UserRoundPlusIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, EmptyState, Input, Tooltip } from '@tahti-player/ui';

import {
  addModerator,
  fetchModerators,
  removeModerator,
  type ModeratorRow,
} from '../../api/artist-settings';
import { ConfirmDialog } from '../ConfirmDialog';
import { PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

/** The people the channel owner trusts to moderate the channel's chat:
 * the list, adding one by username, and removing one after a confirm. */
export function ChannelModeratorsPanel() {
  const [mods, setMods] = useState<ModeratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [pendingRemove, setPendingRemove] = useState<ModeratorRow | null>(null);

  const reload = useCallback(() => {
    void fetchModerators().then((result) => {
      setMods(result.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // People paste handles with the @ in front; the API wants the bare name.
  const handle = username.trim().replace(/^@+/, '');

  const add = () => {
    if (!handle) {
      return;
    }
    void addModerator(handle).then((result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setUsername('');
      toast.success(
        `Added ${result.data.displayName} as moderator. They've been notified.`,
      );
      reload();
    });
  };

  return (
    <StudioPanel
      title="Channel moderators"
      description="People you trust to look after your channel's chat: they can remove messages and ban people from posting. They cannot change your channel or its settings. Tahti tells them when you add them."
    >
      <div className="flex flex-col gap-4">
        {loading ? (
          <PageLoading label="Loading…" />
        ) : mods.length === 0 ? (
          <EmptyState size="sm" title="No moderators yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {mods.map((moderator) => (
              <li
                key={moderator.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {moderator.displayName} (@{moderator.username})
                </span>
                <Tooltip content="Remove moderator" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Remove ${moderator.displayName} as moderator`}
                    onClick={() => setPendingRemove(moderator)}
                  >
                    <Trash2Icon size={14} aria-hidden />
                  </Button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <Input
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
            placeholder="listener-handle"
            className="min-w-0 sm:min-w-48"
          />
          <Tooltip content="Add moderator" side="top">
            <Button
              size="icon-sm"
              disabled={!handle}
              aria-label="Add moderator"
              onClick={add}
            >
              <UserRoundPlusIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </div>
      </div>
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={
          pendingRemove
            ? `Remove ${pendingRemove.displayName} as moderator?`
            : 'Remove moderator?'
        }
        description="They lose chat moderation on this channel."
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const moderator = pendingRemove;
          setPendingRemove(null);
          if (!moderator) {
            return;
          }
          void removeModerator(moderator.id).then((result) => {
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success('Moderator removed.');
            reload();
          });
        }}
      />
    </StudioPanel>
  );
}
