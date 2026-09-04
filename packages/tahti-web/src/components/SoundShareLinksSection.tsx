import { CheckIcon, LinkIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, CopyButton, Input, Select, Tooltip } from '@tahti-player/ui';

import {
  createSoundShare,
  fetchSoundShares,
  revokeSoundShare,
  type SoundShare,
} from '../api/studio';
import { ConfirmDialog } from './ConfirmDialog';

const EXPIRY_OPTIONS = [1, 3, 7, 30, 0] as const;

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) {
    return 'No expiry';
  }
  const remainingDays = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000),
  );
  return remainingDays === 0
    ? 'Expired'
    : `${remainingDays} day${remainingDays === 1 ? '' : 's'} left`;
}

function shareLinkFor(soundId: string, token: string): string {
  return `${window.location.origin}/t/${soundId}?key=${token}`;
}

/** Only renders for a PRIVATE/STASH sound — generates a keyed link
 * (`/t/:id?key=...`) that opens the standard track/player page for
 * someone who isn't otherwise allowed to see it. The link only grants
 * access to that one sound; it doesn't change its visibility. Per the
 * share-link contract (see SoundShare in api/studio.ts), any comment or
 * reaction posted through a keyed visit must not fan out as a public
 * event — that's a backend guarantee this panel can't itself enforce. */
export function SoundShareLinksSection({ soundId }: { soundId: string }) {
  const [shares, setShares] = useState<SoundShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [granteeUsername, setGranteeUsername] = useState('');
  const [permission, setPermission] = useState<'READ' | 'DOWNLOAD'>('READ');
  const [expiryDays, setExpiryDays] = useState(7);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    void fetchSoundShares(soundId).then((result) => {
      setShares(result.data);
      setLoading(false);
    });
  };

  useEffect(reload, [soundId]);

  const create = async () => {
    setBusy(true);
    const username = granteeUsername.trim().replace(/^@/, '');
    const result = await createSoundShare(soundId, {
      permission,
      ...(username ? { granteeUsername: username } : {}),
      ...(expiryDays > 0 ? { expiresInDays: expiryDays } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShares((current) => [...current, result.data]);
    setGranteeUsername('');
    toast.success('Share link created.');
  };

  const revoke = async (shareId: string) => {
    setBusy(true);
    const result = await revokeSoundShare(soundId, shareId);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setShares((current) => current.filter((share) => share.id !== shareId));
    toast.success('Share link revoked.');
  };

  return (
    <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3">
      <div>
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <LinkIcon size={14} aria-hidden />
          Share link
        </span>
        <span className="text-foreground-secondary block text-xs">
          Anyone with the link opens this track&apos;s normal page and player
          without it being public. Reactions and comments made through it are
          logged, not broadcast.
        </span>
      </div>

      {loading ? (
        <p className="text-foreground-secondary text-xs">Loading…</p>
      ) : shares.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {shares.map((share) => (
            <li
              key={share.id}
              className="border-border bg-background flex flex-col gap-1.5 rounded-md border px-2.5 py-2 text-xs"
            >
              <span className="text-foreground-secondary">
                {share.granteeUsername
                  ? `@${share.granteeUsername}`
                  : 'Anyone with the link'}
                {' · '}
                {share.permission === 'DOWNLOAD'
                  ? 'Play & download'
                  : 'Play only'}
                {' · '}
                {formatExpiry(share.expiresAt)}
              </span>
              {/* System rule: any field displaying a URL pairs it with
                  CopyButton (@tahti-player/ui) inline — never a bare
                  string the person has to select by hand. See
                  WORKPLAN.md's URL-field sweep entry for the rest of the
                  app's fields still owed this treatment. */}
              <div className="flex items-center gap-2">
                <code className="border-border bg-background-secondary min-w-0 flex-1 overflow-x-auto rounded-md border px-2 py-1 whitespace-nowrap">
                  {shareLinkFor(soundId, share.token)}
                </code>
                <CopyButton
                  text={shareLinkFor(soundId, share.token)}
                  aria-label="Copy share link"
                  variant="text"
                  toastMessage="Link copied."
                />
                <Tooltip content="Revoke link" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    disabled={busy}
                    aria-label="Revoke link"
                    onClick={() => setPendingRevokeId(share.id)}
                  >
                    <XIcon size={13} aria-hidden />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground-secondary text-xs">No share links yet.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          className="flex-1"
          label="Limit to a username (optional)"
          value={granteeUsername}
          onChange={(e) => setGranteeUsername(e.target.value)}
          placeholder="@username, or leave empty for link access"
        />
        <Select
          label="Access"
          value={permission}
          onValueChange={(value) => setPermission(value as 'READ' | 'DOWNLOAD')}
          options={[
            { id: 'READ', label: 'Play only' },
            { id: 'DOWNLOAD', label: 'Play & download' },
          ]}
        />
        <Select
          label="Expires"
          value={String(expiryDays)}
          onValueChange={(value) => setExpiryDays(Number(value))}
          options={EXPIRY_OPTIONS.map((days) => ({
            id: String(days),
            label: days === 0 ? 'Never' : `${days} day${days === 1 ? '' : 's'}`,
          }))}
        />
        <Button size="sm" disabled={busy} onClick={() => void create()}>
          <CheckIcon size={14} aria-hidden className="mr-1.5" />
          Create link
        </Button>
      </div>
      <ConfirmDialog
        isOpen={pendingRevokeId !== null}
        title="Revoke this share link?"
        description="It will stop working immediately."
        confirmLabel="Revoke"
        onCancel={() => setPendingRevokeId(null)}
        onConfirm={() => {
          const shareId = pendingRevokeId;
          setPendingRevokeId(null);
          if (!shareId) {
            return;
          }
          void revoke(shareId);
        }}
      />
    </div>
  );
}
