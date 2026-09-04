import {
  BanIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundPlusIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Tabs, Tooltip, ViewShell } from '@tahti-player/ui';

import {
  addModerator,
  banChatFingerprint,
  fetchChatBans,
  fetchModerators,
  removeModerator,
  unbanChatFingerprint,
  type ChatBan,
  type ModeratorRow,
} from '../../api/artist-settings';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { useAuthStore } from '../../stores/authStore';

export function StudioModerationView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const slug = user?.channel?.slug ?? '';

  const [mods, setMods] = useState<ModeratorRow[]>([]);
  const [bans, setBans] = useState<ChatBan[]>([]);
  const [newModUsername, setNewModUsername] = useState('');
  const [newBanHash, setNewBanHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingRemoveMod, setPendingRemoveMod] = useState<ModeratorRow | null>(
    null,
  );

  const reload = () => {
    void Promise.all([fetchModerators(), fetchChatBans(slug)]).then(
      ([m, b]) => {
        setMods(m.data);
        setBans(b.data);
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    reload();
  }, [slug]);

  const content = (
    <>
      <Tabs
        listClassName="border-border border-b pb-3"
        panelClassName="pt-2"
        items={[
          {
            id: 'moderators',
            label: 'Moderators',
            icon: <ShieldCheckIcon size={14} />,
            content: (
              <StudioPanel
                title="Delegated moderators"
                description="Trusted listeners who can moderate chat on your behalf."
              >
                <div className="flex flex-col gap-4">
                  {loading ? (
                    <PageLoading label="Loading…" />
                  ) : mods.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No moderators yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {mods.map((m) => (
                        <li
                          key={m.id}
                          className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <span>
                            {m.displayName} (@{m.username})
                          </span>
                          <Tooltip content="Remove moderator" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Remove ${m.displayName} as moderator`}
                              onClick={() => setPendingRemoveMod(m)}
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
                      value={newModUsername}
                      onChange={(e) => setNewModUsername(e.target.value)}
                      placeholder="listener-handle"
                      className="min-w-0 sm:min-w-48"
                    />
                    <Tooltip content="Add moderator" side="top">
                      <Button
                        size="icon-sm"
                        disabled={!newModUsername.trim()}
                        aria-label="Add moderator"
                        onClick={() => {
                          void addModerator(newModUsername.trim()).then((r) => {
                            if (!r.ok) {
                              toast.error(r.error);
                            } else {
                              setNewModUsername('');
                              toast.success(
                                `Added ${r.data.displayName} as moderator.`,
                              );
                              reload();
                            }
                          });
                        }}
                      >
                        <UserRoundPlusIcon size={15} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </StudioPanel>
            ),
          },
          {
            id: 'bans',
            label: 'Chat bans',
            icon: <BanIcon size={14} />,
            content: (
              <StudioPanel
                title="Chat bans"
                description="Stop a device or session from posting by its chat fingerprint."
              >
                <div className="flex flex-col gap-4">
                  {loading ? (
                    <PageLoading label="Loading…" />
                  ) : bans.length === 0 ? (
                    <p className="text-foreground-secondary text-sm">
                      No active bans.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {bans.map((b) => (
                        <li
                          key={b.fingerprintHash}
                          className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <div className="font-mono text-xs">
                              {b.fingerprintHash}
                            </div>
                            <div className="text-foreground-secondary text-xs">
                              Banned {new Date(b.bannedAt).toLocaleString()}
                            </div>
                          </div>
                          <Tooltip content="Unban fingerprint" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Unban ${b.fingerprintHash}`}
                              onClick={() => {
                                void unbanChatFingerprint(
                                  slug,
                                  b.fingerprintHash,
                                ).then((r) => {
                                  if (!r.ok) {
                                    toast.error(r.error);
                                  } else {
                                    toast.success('Unbanned.');
                                    reload();
                                  }
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
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <Input
                      label="Fingerprint hash"
                      value={newBanHash}
                      onChange={(e) => setNewBanHash(e.target.value)}
                      placeholder="from a chat message's report action"
                      className="min-w-0 sm:min-w-48"
                    />
                    <Tooltip content="Ban fingerprint" side="top">
                      <Button
                        size="icon-sm"
                        disabled={!newBanHash.trim()}
                        aria-label="Ban fingerprint"
                        onClick={() => {
                          void banChatFingerprint(slug, newBanHash.trim()).then(
                            (r) => {
                              if (!r.ok) {
                                toast.error(r.error);
                              } else {
                                setNewBanHash('');
                                toast.success('Fingerprint banned.');
                                reload();
                              }
                            },
                          );
                        }}
                      >
                        <BanIcon size={15} aria-hidden />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </StudioPanel>
            ),
          },
        ]}
      />
      <ConfirmDialog
        isOpen={pendingRemoveMod !== null}
        title={
          pendingRemoveMod
            ? `Remove ${pendingRemoveMod.displayName} as moderator?`
            : 'Remove moderator?'
        }
        description="They lose chat moderation on this channel."
        confirmLabel="Remove"
        onCancel={() => setPendingRemoveMod(null)}
        onConfirm={() => {
          const moderator = pendingRemoveMod;
          setPendingRemoveMod(null);
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
    </>
  );

  return (
    <StudioGate>
      <div
        className={
          embedded
            ? 'flex flex-col gap-6'
            : 'studio-page-layout mx-auto flex max-w-3xl flex-col gap-6'
        }
      >
        {!embedded && <StudioNav current="/studio/moderation" />}
        {embedded ? (
          content
        ) : (
          <ViewShell
            title="Moderation"
            subtitle="Delegate chat moderation and manage channel bans."
            classes={{ root: 'px-0 pt-0' }}
          >
            {content}
          </ViewShell>
        )}
      </div>
    </StudioGate>
  );
}
