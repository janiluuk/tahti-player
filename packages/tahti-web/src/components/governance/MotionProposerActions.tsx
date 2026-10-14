import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@tahti-player/ui';

import { withdrawMotionDraft } from '../../api/governance-drafts';
import type { GovernanceMotion } from '../../api/types';
import { isMotionProposer } from '../../lib/motionProposer';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ConfirmDialog';

export function MotionProposerActions({
  motion,
  onChanged,
}: {
  motion: GovernanceMotion;
  onChanged: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (motion.state !== 'DRAFT' || !isMotionProposer(motion, user)) {
    return null;
  }

  const withdraw = () => {
    setConfirming(false);
    setBusy(true);
    setError(null);
    void withdrawMotionDraft(motion.id).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChanged();
      void navigate({ to: '/governance' });
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground-secondary text-xs">
          You proposed this draft.
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Withdraw draft
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-accent-red-strong text-xs">
          {error}
        </p>
      )}
      <ConfirmDialog
        isOpen={confirming}
        title="Withdraw this motion?"
        description="The draft, its discussion and its seconds are deleted. This cannot be undone."
        confirmLabel="Withdraw"
        onCancel={() => setConfirming(false)}
        onConfirm={withdraw}
      />
    </div>
  );
}
