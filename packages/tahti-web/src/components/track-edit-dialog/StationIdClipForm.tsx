import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@tahti-player/ui';

import {
  createClipFromSound,
  SOUND_CLIP_MAX_DURATION_SEC,
} from '../../api/sound-clip';

const DEFAULT_CLIP_SEC = 15;

function check(start: number, end: number, durationSec: number | null) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0) {
    return 'Use seconds from the start of the track.';
  }
  if (end <= start) {
    return 'End must be after start.';
  }
  if (end - start > SOUND_CLIP_MAX_DURATION_SEC) {
    return `A clip can be ${SOUND_CLIP_MAX_DURATION_SEC} seconds or less.`;
  }
  if (durationSec != null && end > durationSec + 0.05) {
    return 'End is past the end of the track.';
  }
  return null;
}

/** Cut a short station-ID clip from this track into the channel's
 * announcements (Studio → Channel → Radio → Announcements). */
export function StationIdClipForm({
  soundId,
  durationSec,
  playheadSec,
}: {
  soundId: string;
  durationSec: number | null;
  /** Current position when this track is the one playing. */
  playheadSec: number | null;
}) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState(
    String(Math.min(DEFAULT_CLIP_SEC, durationSec ?? DEFAULT_CLIP_SEC)),
  );
  const [busy, setBusy] = useState(false);

  const error = check(Number(start), Number(end), durationSec);

  const submit = async () => {
    setBusy(true);
    const result = await createClipFromSound(soundId, {
      startSec: Number(start),
      endSec: Number(end),
      title,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `“${result.data.title}” added to your announcements. Switch it on there once it's ready.`,
    );
    setTitle('');
  };

  const playhead =
    playheadSec != null ? String(Math.round(playheadSec * 10) / 10) : null;

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">Make a station ID clip</p>
        <p className="text-foreground-secondary text-sm">
          Up to {SOUND_CLIP_MAX_DURATION_SEC} seconds of this track, added to
          your channel&apos;s announcements.
        </p>
      </div>
      <Input
        label="Clip title (optional)"
        value={title}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            variant="number"
            label="Start (s)"
            size="sm"
            min={0}
            step={0.1}
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
          {playhead != null ? (
            <Button
              variant="text"
              size="sm"
              className="self-start"
              onClick={() => setStart(playhead)}
            >
              Use playhead
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            variant="number"
            label="End (s)"
            size="sm"
            min={0}
            step={0.1}
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
          {playhead != null ? (
            <Button
              variant="text"
              size="sm"
              className="self-start"
              onClick={() => setEnd(playhead)}
            >
              Use playhead
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="text-accent-red-strong text-xs" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        size="sm"
        className="self-start"
        disabled={busy || error !== null}
        onClick={() => void submit()}
      >
        {busy ? 'Making clip…' : 'Make clip'}
      </Button>
    </div>
  );
}
