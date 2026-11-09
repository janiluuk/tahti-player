import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Input } from '@tahti-player/ui';

const MIN = 2;
const MAX = 100;

export function EveryNthInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (everyNth: number) => void;
}) {
  const { t } = useTranslation('web');
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) {
      return;
    }
    const parsed = Number(draft);
    setDraft(null);
    if (
      draft.trim() !== '' &&
      Number.isInteger(parsed) &&
      parsed >= MIN &&
      parsed <= MAX &&
      parsed !== value
    ) {
      onCommit(parsed);
    }
  };

  return (
    <Input
      type="number"
      inputMode="numeric"
      variant="number"
      size="sm"
      min={MIN}
      max={MAX}
      label={t('everyNthInputText.everyNth')}
      value={draft ?? String(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
      }}
      className="w-24"
    />
  );
}
