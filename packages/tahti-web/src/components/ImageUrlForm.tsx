import { useState, type FormEvent } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Input } from '@tahti-player/ui';

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

/** Paste a public image URL for the API to fetch and store. */
export function ImageUrlForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (url: string) => Promise<boolean>;
}) {
  const { t } = useTranslation('web');
  const [url, setUrl] = useState('');
  const trimmed = url.trim();
  const valid = isHttpUrl(trimmed);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) {
      return;
    }
    if (await onSubmit(trimmed)) {
      setUrl('');
    }
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => void submit(event)}
    >
      <Input
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        label={t('imageUrlForm.imageUrl')}
        description={t('imageUrlForm.aDirectLinkToA')}
        value={url}
        placeholder="https://example.com/cover.jpg"
        error={
          trimmed && !valid ? i18n.t('web:batch52.enterFullLink') : undefined
        }
        onChange={(event) => setUrl(event.target.value)}
      />
      <Button type="submit" className="self-start" disabled={busy || !valid}>
        {busy
          ? t('imageUrlFormStates.fetching')
          : t('imageUrlFormStates.useThisImage')}
      </Button>
    </form>
  );
}
