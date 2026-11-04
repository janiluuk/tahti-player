import { BanIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import { blockUser, unblockUser } from '../api/blocks';
import { ConfirmDialog } from './ConfirmDialog';

export function DmBlockButton({
  username,
  displayName,
  blocked,
  onChange,
}: {
  username: string;
  displayName: string;
  blocked: boolean;
  onChange: (blocked: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const unblock = () => {
    setBusy(true);
    void unblockUser(username).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(false);
      toast.success(t('dm.unblockedNamed', { name: displayName }));
    });
  };

  const block = () => {
    setConfirming(false);
    setBusy(true);
    void blockUser(username).then((result) => {
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(true);
      toast.success(t('dm.blockedNamed', { name: displayName }));
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="text"
        disabled={busy}
        onClick={blocked ? unblock : () => setConfirming(true)}
        className="gap-1.5"
      >
        <BanIcon size={14} aria-hidden />
        {blocked ? t('dm.unblock') : t('dm.block')}
      </Button>
      <ConfirmDialog
        destructive
        isOpen={confirming}
        title={t('dm.blockConfirmTitle', { name: displayName })}
        description={t('dm.blockConfirmDescription')}
        confirmLabel={t('dm.block')}
        onCancel={() => setConfirming(false)}
        onConfirm={block}
      />
    </>
  );
}
