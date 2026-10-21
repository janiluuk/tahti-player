import { useEffect, useState } from 'react';

import { Button, Dialog, Input } from '@tahti-player/ui';

import {
  fetchAdminAnnouncementSource,
  renderAdminAnnouncement,
  validateAnnouncementTrim,
  type AdminAnnouncementClip,
  type AdminAnnouncementSource,
} from '../../../api/admin';

type Fields = {
  startSec: string;
  endSec: string;
  fadeInSec: string;
  fadeOutSec: string;
};

const FIELDS: { key: keyof Fields; label: string }[] = [
  { key: 'startSec', label: 'Start (s)' },
  { key: 'endSec', label: 'End (s)' },
  { key: 'fadeInSec', label: 'Fade in (s)' },
  { key: 'fadeOutSec', label: 'Fade out (s)' },
];

export function AnnouncementTrimDialog({
  clip,
  onClose,
  onRendered,
}: {
  clip: AdminAnnouncementClip | null;
  onClose: () => void;
  onRendered: () => void;
}) {
  const [source, setSource] = useState<AdminAnnouncementSource | null>(null);
  const [fields, setFields] = useState<Fields>({
    startSec: '0',
    endSec: '',
    fadeInSec: '0',
    fadeOutSec: '0',
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!clip) {
      return;
    }
    let cancelled = false;
    setSource(null);
    setError(null);
    setFields({
      startSec: '0',
      endSec: clip.durationSec != null ? String(clip.durationSec) : '',
      fadeInSec: '0',
      fadeOutSec: '0',
    });
    void fetchAdminAnnouncementSource(clip.id).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSource(result.source);
      if (result.source.durationSec != null) {
        setFields((current) => ({
          ...current,
          endSec: String(result.source.durationSec),
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clip]);

  const durationSec = source?.durationSec ?? clip?.durationSec ?? null;

  const submit = () => {
    if (!clip) {
      return;
    }
    const trim = {
      startSec: Number(fields.startSec),
      endSec: Number(fields.endSec),
      fadeInSec: Number(fields.fadeInSec),
      fadeOutSec: Number(fields.fadeOutSec),
    };
    const invalid =
      fields.endSec.trim() === ''
        ? 'Set where the clip ends.'
        : validateAnnouncementTrim(trim, durationSec);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    void renderAdminAnnouncement(clip.id, trim).then((result) => {
      setPending(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onRendered();
    });
  };

  return (
    <Dialog.Root isOpen={clip !== null} onClose={onClose} className="max-w-lg">
      <Dialog.Title>Trim {clip?.title}</Dialog.Title>
      <Dialog.Description>
        The trim is always cut from the original upload, so you can change it
        again later without losing quality.
      </Dialog.Description>
      <div className="flex flex-col gap-4">
        {source ? (
          <audio
            src={source.originalUrl}
            controls
            preload="metadata"
            aria-label={`Original upload of ${source.title}`}
            className="w-full"
          />
        ) : !error ? (
          <p className="text-foreground-secondary text-sm" role="status">
            Loading the original upload…
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((field) => (
            <Input
              key={field.key}
              type="number"
              variant="number"
              size="sm"
              min={0}
              max={field.key.startsWith('fade') ? 30 : undefined}
              step={0.1}
              label={field.label}
              value={fields[field.key]}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
            />
          ))}
        </div>
        {durationSec != null ? (
          <p className="text-foreground-secondary text-xs">
            The original is {durationSec} s long.
          </p>
        ) : null}
        {error ? (
          <p className="text-accent-red-strong text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={submit}>
            {pending ? 'Rendering…' : 'Render trim'}
          </Button>
        </div>
      </div>
    </Dialog.Root>
  );
}
