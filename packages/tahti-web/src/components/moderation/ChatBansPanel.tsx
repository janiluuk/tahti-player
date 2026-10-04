import { BanIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tooltip } from '@tahti-player/ui';

import {
  banChatFingerprint,
  fetchChatBans,
  unbanChatFingerprint,
  type ChatBan,
} from '../../api/artist-settings';
import { useAuthStore } from '../../stores/authStore';
import { PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

/** Devices or sessions barred from posting in the channel chat, by their
 * chat fingerprint: the list, lifting a ban, and adding one by hash. */
export function ChatBansPanel() {
  const slug = useAuthStore((s) => s.user?.channel?.slug ?? '');
  const [bans, setBans] = useState<ChatBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState('');

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
      description="Stop a device or session from posting by its chat fingerprint."
    >
      <div className="flex flex-col gap-4">
        {loading ? (
          <PageLoading label="Loading…" />
        ) : bans.length === 0 ? (
          <p className="text-foreground-secondary text-sm">No active bans.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bans.map((ban) => (
              <li
                key={ban.fingerprintHash}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-mono text-xs">{ban.fingerprintHash}</div>
                  <div className="text-foreground-secondary text-xs">
                    Banned {new Date(ban.bannedAt).toLocaleString()}
                  </div>
                </div>
                <Tooltip content="Unban fingerprint" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label={`Unban ${ban.fingerprintHash}`}
                    onClick={() => {
                      void unbanChatFingerprint(slug, ban.fingerprintHash).then(
                        (result) => {
                          if (!result.ok) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success('Unbanned.');
                          reload();
                        },
                      );
                    }}
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
            label="Fingerprint hash"
            value={hash}
            onChange={(event) => setHash(event.target.value)}
            placeholder="from a chat message's report action"
            className="min-w-0 sm:min-w-48"
          />
          <Tooltip content="Ban fingerprint" side="top">
            <Button
              size="icon-sm"
              disabled={!hash.trim()}
              aria-label="Ban fingerprint"
              onClick={() => {
                void banChatFingerprint(slug, hash.trim()).then((result) => {
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  setHash('');
                  toast.success('Fingerprint banned.');
                  reload();
                });
              }}
            >
              <BanIcon size={15} aria-hidden />
            </Button>
          </Tooltip>
        </div>
      </div>
    </StudioPanel>
  );
}
