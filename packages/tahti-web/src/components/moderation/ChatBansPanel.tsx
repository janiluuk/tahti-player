import { Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, EmptyState, Tooltip } from '@tahti-player/ui';

import {
  fetchChatBans,
  unbanChat,
  type ChatBan,
} from '../../api/artist-settings';
import { useAuthStore } from '../../stores/authStore';
import { PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

/** A ban set from a message carries the name its sender posted under. Older
 * bans were typed in by hash and have nothing but that to show. */
function banName(ban: ChatBan): string {
  return (
    ban.handle?.trim() || `Unnamed visitor ${ban.fingerprintHash.slice(0, 8)}`
  );
}

type Props = {
  /** The channel whose bans to show; defaults to the signed-in account's. */
  slug?: string;
};

/** The people barred from posting in the channel's chat, and lifting a ban.
 * Bans are set from a message, under Recent messages. */
export function ChatBansPanel({ slug: slugProp }: Props) {
  const ownSlug = useAuthStore((s) => s.user?.channel?.slug ?? '');
  const slug = slugProp ?? ownSlug;
  const [bans, setBans] = useState<ChatBan[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    void fetchChatBans(slug).then((result) => {
      setBans(result.data);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <StudioPanel
      title="Chat bans"
      description="People who can no longer post in this chat. To ban someone, use Ban on one of their messages under Recent messages."
    >
      {loading ? (
        <PageLoading label="Loading…" />
      ) : bans.length === 0 ? (
        <EmptyState size="sm" title="Nobody is banned" />
      ) : (
        <ul className="flex flex-col gap-2">
          {bans.map((ban) => (
            <li
              key={ban.id ?? ban.fingerprintHash}
              className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="font-semibold break-words">{banName(ban)}</div>
                <div className="text-foreground-secondary text-xs">
                  Banned {new Date(ban.bannedAt).toLocaleString()}
                </div>
              </div>
              <Tooltip content="Lift ban" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Lift the ban on ${banName(ban)}`}
                  onClick={() => {
                    void unbanChat(slug, ban).then((result) => {
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success(`${banName(ban)} can post again.`);
                      reload();
                    });
                  }}
                >
                  <Trash2Icon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
