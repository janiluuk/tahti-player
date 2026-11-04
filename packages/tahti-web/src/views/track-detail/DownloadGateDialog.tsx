import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
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
  const { t } = useTranslation('web');
  return (
    <li className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2">
        {done ? (
          <CheckIcon
            size={16}
            className="text-accent-green-strong"
            aria-hidden
          />
        ) : null}
        {label}
        {done ? (
          <span className="sr-only">{t('downloadGate.done')}</span>
        ) : null}
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
  const { t } = useTranslation('web');
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
      toast.error(t('downloadGate.copyFailed'));
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
      <Dialog.Title>{t('downloadGate.title')}</Dialog.Title>
      <Dialog.Description>
        {t('downloadGate.description', { name: artist.displayName })}
      </Dialog.Description>
      <ul className="mt-4 flex flex-col gap-2">
        {status.followRequired ? (
          <Step
            done={status.followSatisfied}
            label={t('actions.followArtist', { name: artist.displayName })}
          >
            {signedIn ? (
              <Button size="xs" disabled={busy} onClick={() => void follow()}>
                {t('actions.follow')}
              </Button>
            ) : (
              <span className="text-foreground-secondary text-xs">
                {t('downloadGate.signInToFollow')}
              </span>
            )}
          </Step>
        ) : null}
        {status.repostRequired ? (
          <Step
            done={status.repostSatisfied}
            label={t('downloadGate.shareStep')}
          >
            <Button
              size="xs"
              variant="secondary"
              disabled={busy}
              onClick={() => void share()}
            >
              {t('downloadGate.copyLink')}
            </Button>
          </Step>
        ) : null}
      </ul>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
        <Button
          disabled={busy || !status.canDownload}
          onClick={() => {
            onClose();
            onDownload();
          }}
        >
          {t('actions.download')}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
