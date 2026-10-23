import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button, InlineError, Input, Textarea } from '@tahti-player/ui';

import {
  editMotionDraft,
  withdrawMotionDraft,
} from '../../api/governance-drafts';
import type { GovernanceMotion } from '../../api/types';
import { isMotionProposer } from '../../lib/motionProposer';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../ConfirmDialog';

function savedMessage(secondsCleared: number): string {
  if (secondsCleared === 0) {
    return 'Draft saved.';
  }
  return secondsCleared === 1
    ? 'Draft saved. Its one second was cleared, because it backed the old text.'
    : `Draft saved. Its ${secondsCleared} seconds were cleared, because they backed the old text.`;
}

export function MotionProposerActions({
  motion,
  description,
  onChanged,
}: {
  motion: GovernanceMotion;
  /** Only the motion page passes this; editing needs the full text. */
  description?: string;
  onChanged: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(motion.title);
  const [text, setText] = useState(description ?? '');

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

  const save = () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    void editMotionDraft(motion.id, {
      title: title.trim(),
      description: text.trim(),
    }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setNotice(savedMessage(result.secondsCleared));
      onChanged();
    });
  };

  if (editing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Draft title"
          maxLength={200}
        />
        <Textarea
          tone="secondary"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={10000}
          aria-label="Draft text"
          className="text-sm"
        />
        {(motion.secondCount ?? 0) > 0 && (
          <p className="text-foreground-secondary text-xs">
            Changing the text clears the seconds it has, since they backed the
            old wording.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy || !title.trim() || !text.trim()}
            onClick={save}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
        {error && <InlineError textSize="xs">{error}</InlineError>}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-foreground-secondary text-xs">
          You proposed this draft.
        </span>
        {description !== undefined && (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setTitle(motion.title);
              setText(description);
              setNotice(null);
              setEditing(true);
            }}
          >
            Edit draft
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Withdraw draft
        </Button>
      </div>
      {notice && (
        <p role="status" className="text-foreground-secondary text-xs">
          {notice}
        </p>
      )}
      {error && <InlineError textSize="xs">{error}</InlineError>}
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
