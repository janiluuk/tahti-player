import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input } from '@tahti-player/ui';

/** Username form at the top of the hearthis.at card; `onSave` gets the handle without a leading `@` and resolves true when it was saved. */
export function HearthisConnectForm({
  handle,
  onSave,
}: {
  handle: string | null;
  onSave: (value: string) => Promise<boolean>;
}) {
  const { t } = useTranslation('web');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = draft.trim().replace(/^@/, '');
    if (!value) {
      return;
    }
    setSaving(true);
    try {
      if (await onSave(value)) {
        setDraft('');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {handle ? (
        <span className="text-sm">
          {t('hearthisCardStates.connectedAs')}{' '}
          <span className="font-medium">@{handle}</span>
        </span>
      ) : (
        <span className="text-foreground-secondary text-sm">
          {t('hearthisCardStates.addUsernameHint')}
        </span>
      )}
      <Input
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-w-0 flex-1 basis-40"
        size="sm"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={
          handle
            ? t('hearthisCardStates.changeUsername')
            : t('hearthisCardStates.hearthisUsername')
        }
        aria-label={t('hearthisCardStates.hearthisUsername')}
      />
      <Button size="sm" disabled={saving || !draft.trim()} type="submit">
        {saving
          ? t('hearthisCardStates.saving')
          : handle
            ? t('hearthisCardStates.update')
            : t('hearthisCardStates.connect')}
      </Button>
    </form>
  );
}
