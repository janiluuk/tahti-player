import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, SaveButton, Select, Tooltip } from '@tahti-player/ui';

import { patchReleaseTrackCredits } from '../../../api/studio';
import {
  TRACK_CREDIT_ROLES,
  type StudioReleaseTrack,
  type TrackCredit,
} from '../../../api/studio-types';

function TrackCreditsRow({
  releaseId,
  track,
  onSaved,
}: {
  releaseId: string;
  track: StudioReleaseTrack;
  onSaved: (credits: TrackCredit[] | null) => void;
}) {
  const [credits, setCredits] = useState<TrackCredit[]>(track.credits ?? []);
  const [saving, setSaving] = useState(false);

  const update = (index: number, patch: Partial<TrackCredit>) => {
    setCredits((current) =>
      current.map((credit, i) =>
        i === index ? { ...credit, ...patch } : credit,
      ),
    );
  };

  const save = async () => {
    setSaving(true);
    const result = await patchReleaseTrackCredits(releaseId, track.id, credits);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCredits(result.credits ?? []);
    onSaved(result.credits);
    toast.success(`Credits saved for ${track.title}.`);
  };

  const roleOptions = Array.from(
    new Set([...TRACK_CREDIT_ROLES, ...credits.map((credit) => credit.role)]),
  ).map((role) => ({ id: role, label: role }));

  return (
    <li className="border-border flex flex-col gap-2 rounded-md border-(length:--border-width) p-4">
      <p className="font-medium">
        {track.position}. {track.title}
      </p>
      {credits.length === 0 && (
        <p className="text-foreground-secondary text-xs">
          No credits on this track yet.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {credits.map((credit, index) => (
          <li
            key={index}
            className="grid gap-2 sm:grid-cols-[9rem_1fr_8rem_auto]"
          >
            <Select
              className="text-xs"
              options={roleOptions}
              value={credit.role}
              disabled={saving}
              label={`Role for credit ${index + 1} on ${track.title}`}
              onValueChange={(role) => update(index, { role })}
            />
            <Input
              value={credit.name}
              placeholder="Name"
              disabled={saving}
              aria-label={`Name for credit ${index + 1} on ${track.title}`}
              onChange={(event) => update(index, { name: event.target.value })}
            />
            <Input
              value={credit.artistUsername ? `@${credit.artistUsername}` : ''}
              placeholder="@username"
              disabled={saving}
              maxLength={33}
              aria-label={`Tahti username for credit ${index + 1} on ${track.title}`}
              onChange={(event) => {
                const raw = event.target.value
                  .trim()
                  .replace(/^@/, '')
                  .toLowerCase();
                update(index, {
                  artistUsername: raw.length > 0 ? raw : undefined,
                });
              }}
            />
            <Tooltip content={`Remove credit ${index + 1}`} side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={saving}
                aria-label={`Remove credit ${index + 1} on ${track.title}`}
                onClick={() =>
                  setCredits((current) => current.filter((_, i) => i !== index))
                }
              >
                <Trash2Icon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={saving || credits.length >= 20}
          onClick={() =>
            setCredits((current) => [...current, { role: 'vocals', name: '' }])
          }
        >
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          Add credit
        </Button>
        <SaveButton
          saving={saving}
          label="Save credits"
          aria-label={`Save credits for ${track.title}`}
          onClick={() => void save()}
        />
      </div>
    </li>
  );
}

export function ReleaseTrackCreditsPanel({
  releaseId,
  tracks,
  onTrackCreditsSaved,
}: {
  releaseId: string;
  tracks: StudioReleaseTrack[];
  onTrackCreditsSaved: (trackId: string, credits: TrackCredit[] | null) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {tracks.map((track) => (
        <TrackCreditsRow
          key={track.id}
          releaseId={releaseId}
          track={track}
          onSaved={(credits) => onTrackCreditsSaved(track.id, credits)}
        />
      ))}
    </ul>
  );
}
