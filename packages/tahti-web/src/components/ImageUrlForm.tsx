import { useState, type FormEvent } from 'react';

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
        label="Image URL"
        description="A direct link to a JPEG, PNG or WebP image. Tahti keeps its own copy."
        value={url}
        placeholder="https://example.com/cover.jpg"
        error={trimmed && !valid ? 'Enter a full http(s) link' : undefined}
        onChange={(event) => setUrl(event.target.value)}
      />
      <Button type="submit" className="self-start" disabled={busy || !valid}>
        {busy ? 'Fetching…' : 'Use this image'}
      </Button>
    </form>
  );
}
