import { useEffect, useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

import type { AnnouncementClip, AnnouncementTrim } from '../api/announcements';

const MAX_FADE_SEC = 30;

type Draft = Record<keyof AnnouncementTrim, string>;

function validate(draft: Draft): AnnouncementTrim | string {
  const values = Object.fromEntries(
    Object.entries(draft).map(([key, value]) => [key, Number(value)]),
  ) as AnnouncementTrim;
  if (
    Object.values(values).some((value) => !Number.isFinite(value) || value < 0)
  ) {
    return 'Use zero or more seconds in every field.';
  }
  if (values.endSec <= values.startSec) {
    return 'End must be after start.';
  }
  if (values.fadeInSec > MAX_FADE_SEC || values.fadeOutSec > MAX_FADE_SEC) {
    return `Fades can be up to ${MAX_FADE_SEC} seconds.`;
  }
  if (values.fadeInSec + values.fadeOutSec > values.endSec - values.startSec) {
    return 'The fades are longer than the trimmed clip.';
  }
  return values;
}

/** Start/end/fade editor for an announcement clip. Times are measured on
 * the original upload, which every trim starts from. */
export function AnnouncementTrimDialog({
  clip,
  busy,
  onClose,
  onSubmit,
}: {
  clip: AnnouncementClip | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (clip: AnnouncementClip, trim: AnnouncementTrim) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    startSec: '0',
    endSec: '',
    fadeInSec: '0',
    fadeOutSec: '0',
  });

  useEffect(() => {
    if (clip) {
      setDraft({
        startSec: '0',
        endSec: clip.durationSec != null ? String(clip.durationSec) : '',
        fadeInSec: '0',
        fadeOutSec: '0',
      });
    }
  }, [clip]);

  const result = validate(draft);
  const field = (key: keyof AnnouncementTrim, label: string) => (
    <Input
      type="number"
      variant="number"
      label={label}
      size="sm"
      min={0}
      step={0.1}
      value={draft[key]}
      onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
    />
  );

  return (
    <Dialog.Root isOpen={clip !== null} onClose={onClose} className="max-w-md">
      <Dialog.Title>Trim {clip?.title}</Dialog.Title>
      <Dialog.Description>
        Seconds from the start of the clip you uploaded. Trimming again always
        starts from that original.
      </Dialog.Description>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {field('startSec', 'Start (s)')}
        {field('endSec', 'End (s)')}
        {field('fadeInSec', 'Fade in (s)')}
        {field('fadeOutSec', 'Fade out (s)')}
      </div>
      {typeof result === 'string' ? (
        <p className="text-accent-red-strong mt-2 text-xs" role="alert">
          {result}
        </p>
      ) : null}
      <Dialog.Actions>
        <Dialog.Close>Cancel</Dialog.Close>
        <Button
          size="sm"
          disabled={busy || typeof result === 'string'}
          onClick={() => {
            if (clip && typeof result !== 'string') {
              onSubmit(clip, result);
            }
          }}
        >
          {busy ? 'Saving…' : 'Trim clip'}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
