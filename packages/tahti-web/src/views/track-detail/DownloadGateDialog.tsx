import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import { followArtist } from '../../api/follows';
import {
  acknowledgeRepost,
  fetchDownloadGates,
  type DownloadGateStatus,
} from '../../api/sound-download-gates';

type Props = {
  gates: DownloadGateStatus;
  channelSlug: string;
  soundId: string;
  artist: { username: string; displayName: string };
  signedIn: boolean;
  onClose: () => void;
  onDownload: () => void;
};

function Step({
  done,
  label,
  children,
}: {
  done: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2">
        {done ? (
          <CheckIcon size={16} className="text-accent-green" aria-hidden />
        ) : null}
        {label}
        {done ? <span className="sr-only">(done)</span> : null}
      </span>
      {done ? null : children}
    </li>
  );
}

export function DownloadGateDialog({
  gates,
  channelSlug,
  soundId,
  artist,
  signedIn,
  onClose,
  onDownload,
}: Props) {
  const [status, setStatus] = useState(gates);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const next = await fetchDownloadGates(channelSlug, soundId);
    if (next) {
      setStatus(next);
    }
  };

  const follow = async () => {
    setBusy(true);
    const result = await followArtist(artist.username);
    if (result.ok) {
      await refresh();
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  };

  const share = async () => {
    setBusy(true);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/t/${soundId}`,
      );
    } catch {
      toast.error('Could not copy the link — share the page address instead');
    }
    const result = await acknowledgeRepost(channelSlug, soundId);
    if (result.ok) {
      await refresh();
    } else {
      toast.error(result.error);
    }
    setBusy(false);
  };

  return (
    <Dialog.Root isOpen onClose={onClose}>
      <Dialog.Title>Unlock this download</Dialog.Title>
      <Dialog.Description>
        {artist.displayName} gives this track away in return for a little
        support.
      </Dialog.Description>
      <ul className="mt-4 flex flex-col gap-2">
        {status.followRequired ? (
          <Step
            done={status.followSatisfied}
            label={`Follow ${artist.displayName}`}
          >
            {signedIn ? (
              <Button size="xs" disabled={busy} onClick={() => void follow()}>
                Follow
              </Button>
            ) : (
              <span className="text-foreground-secondary text-xs">
                Sign in to follow
              </span>
            )}
          </Step>
        ) : null}
        {status.repostRequired ? (
          <Step done={status.repostSatisfied} label="Share this track">
            <Button size="xs" disabled={busy} onClick={() => void share()}>
              Copy link
            </Button>
          </Step>
        ) : null}
      </ul>
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          disabled={busy || !status.canDownload}
          onClick={() => {
            onClose();
            onDownload();
          }}
        >
          Download
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
