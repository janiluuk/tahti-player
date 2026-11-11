import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError } from '@tahti-player/ui';

import {
  secondMotion,
  withdrawMotionSecond,
} from '../../api/governance-seconds';
import type { GovernanceMotion } from '../../api/types';
import { isMotionProposer } from '../../lib/motionProposer';
import { useAuthStore } from '../../stores/authStore';

export function MotionSecondControl({
  motion,
  onChanged,
}: {
  motion: GovernanceMotion;
  onChanged: () => void;
}) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = motion.secondCount ?? 0;
  const isDraft = motion.state === 'DRAFT';
  const canSecond = isDraft && !isMotionProposer(motion, user);

  if (!isDraft && count === 0) {
    return null;
  }

  const toggle = () => {
    setBusy(true);
    setError(null);
    const action = motion.youSeconded ? withdrawMotionSecond : secondMotion;
    void action(motion.id).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground-secondary text-xs">
          {count > 0
            ? t('motionSecondControl.secondedBy', { count })
            : t('motionSecondControl.noSecondsYet')}
        </span>
        {canSecond && (
          <Button
            size="sm"
            variant={motion.youSeconded ? 'secondary' : 'default'}
            disabled={busy}
            onClick={toggle}
          >
            {motion.youSeconded
              ? t('motionSecondControl.withdraw')
              : t('motionSecondControl.second')}
          </Button>
        )}
      </div>
      {error && <InlineError textSize="xs">{error}</InlineError>}
    </div>
  );
}
