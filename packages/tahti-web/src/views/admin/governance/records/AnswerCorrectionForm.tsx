import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, InlineError, Textarea } from '@tahti-player/ui';

import {
  answerAdminCorrection,
  type CorrectionAnswer,
} from '../../../../api/admin/admin-governance-corrections';

/** Accept or reject a waiting request, with the note the member reads. */
export function AnswerCorrectionForm({
  id,
  onAnswered,
}: {
  id: string;
  onAnswered: () => void;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        onClick={() => setOpen(true)}
      >
        {t('answerCorrection.answer')}
      </Button>
    );
  }

  const answer = (state: CorrectionAnswer['state']) => {
    setBusy(true);
    setError(null);
    void answerAdminCorrection(id, { state, resolutionNote: note }).then(
      (result) => {
        setBusy(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        onAnswered();
      },
    );
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        answer('ACCEPTED');
      }}
    >
      <Textarea
        label={t('answerCorrection.whatWasDecidedTheMember')}
        description={t('answerCorrection.answeringChangesNoRecordBy')}
        rows={2}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
        submitOnModEnter
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" disabled={busy}>
          {t('answerCorrection.accept')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => answer('REJECTED')}
        >
          {t('answerCorrection.reject')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          {t('answerCorrection.cancel')}
        </Button>
      </div>
      {error ? <InlineError textSize="xs">{error}</InlineError> : null}
    </form>
  );
}
