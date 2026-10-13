import {
  AudioWaveformIcon,
  MagnetIcon,
  PlayIcon,
  SquareIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import {
  Alert,
  Button,
  buttonVariants,
  cn,
  SegmentedControl,
} from '@tahti-player/ui';

import {
  snapStepSec,
  useEditorStore,
  type SnapDivision,
} from '../state/editorStore';
import {
  BEATS_PER_BAR,
  isMidiClip,
  midiClipLengthUpdate,
  midiClipWindow,
} from './midiClip';
import { bounceMidiClipToAudio, previewMidiClip } from './midiClipActions';
import { midiSoundBankName, setMidiSoundBank } from './midiRender';
import { quantizeNotes, type PianoNote } from './noteEditing';
import { PianoRoll } from './PianoRoll';

type RollGrid = Extract<SnapDivision, '1/4' | '1/8' | '1/16' | '1/8T'>;

const GRID_OPTIONS: { id: RollGrid; label: string }[] = [
  { id: '1/4', label: '1/4' },
  { id: '1/8', label: '1/8' },
  { id: '1/16', label: '1/16' },
  { id: '1/8T', label: '1/8T' },
];

type Bars = '1' | '2' | '4' | '8';

const BAR_OPTIONS: { id: Bars; label: string }[] = [
  { id: '1', label: '1 bar' },
  { id: '2', label: '2' },
  { id: '4', label: '4' },
  { id: '8', label: '8' },
];

/** At 60 BPM one second is one beat, so the editor's own snap table gives the
 *  roll's grid in beats without a second copy of it. */
const gridBeatsOf = (grid: RollGrid): number => snapStepSec(grid, 60) ?? 0.25;

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export type MidiClipPanelProps = {
  clipId: string;
  className?: string;
};

export function MidiClipPanel({ clipId, className }: MidiClipPanelProps) {
  const clip = useEditorStore((s) => s.clips.find((c) => c.id === clipId));
  const projectBpm = useEditorStore((s) => s.bpm);
  const updateClip = useEditorStore((s) => s.updateClip);
  const [grid, setGrid] = useState<RollGrid>('1/16');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<'preview' | 'bounce' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bankName, setBankName] = useState(midiSoundBankName);
  const stopRef = useRef<(() => void) | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const fileId = useId();

  useEffect(
    () => () => {
      stopRef.current?.();
    },
    [clipId],
  );

  if (!clip || !isMidiClip(clip)) {
    return null;
  }

  const notes = clip.sourcePianoRoll ?? [];
  const { fromBeat, toBeat } = midiClipWindow(clip, projectBpm);
  const lengthBeats = toBeat - fromBeat;
  const bars = String(
    Math.max(1, Math.round(lengthBeats / BEATS_PER_BAR)),
  ) as Bars;
  const gridBeats = gridBeatsOf(grid);

  const setNotes = (next: PianoNote[]) =>
    updateClip(clip.id, { sourcePianoRoll: next });

  const stopPreview = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPreviewing(false);
  };

  const preview = async () => {
    if (previewing) {
      stopPreview();
      return;
    }
    setBusy('preview');
    setError(null);
    try {
      stopRef.current = await previewMidiClip(clip, projectBpm, () =>
        setPreviewing(false),
      );
      setPreviewing(true);
    } catch (e) {
      setError(`Preview failed: ${errorText(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const bounce = async () => {
    stopPreview();
    setBusy('bounce');
    setError(null);
    try {
      await bounceMidiClipToAudio(clip.id);
    } catch (e) {
      setError(`Bounce failed: ${errorText(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const loadBank = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setMidiSoundBank({ name: file.name, bytes: await file.arrayBuffer() });
    setBankName(file.name);
  };

  return (
    <section
      aria-label={`MIDI clip ${clip.label}`}
      className={cn(
        'border-border bg-background flex min-w-0 flex-col gap-2 rounded-lg border p-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-sm font-semibold">
          {clip.label}
          <span className="text-foreground-secondary ml-2 font-mono text-xs font-normal">
            {notes.length} notes · {bankName ?? 'built-in synth'}
          </span>
        </h3>
        <SegmentedControl<RollGrid>
          aria-label="Note grid"
          value={grid}
          onChange={setGrid}
          options={GRID_OPTIONS}
        />
        <SegmentedControl<Bars>
          aria-label="Clip length in bars"
          value={bars}
          options={BAR_OPTIONS}
          onChange={(v) =>
            updateClip(
              clip.id,
              midiClipLengthUpdate(clip, Number(v), projectBpm),
            )
          }
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={notes.length === 0}
          onClick={() => setNotes(quantizeNotes(notes, gridBeats))}
        >
          <MagnetIcon size={14} aria-hidden className="mr-1.5" />
          Quantize
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy !== null || notes.length === 0}
          onClick={() => void preview()}
        >
          {previewing ? (
            <SquareIcon size={14} aria-hidden className="mr-1.5" />
          ) : (
            <PlayIcon size={14} aria-hidden className="mr-1.5" />
          )}
          {previewing ? 'Stop' : busy === 'preview' ? 'Rendering…' : 'Preview'}
        </Button>
        <Button
          size="sm"
          disabled={busy !== null || notes.length === 0}
          onClick={() => void bounce()}
        >
          <AudioWaveformIcon size={14} aria-hidden className="mr-1.5" />
          {busy === 'bounce' ? 'Bouncing…' : 'Bounce clip to audio'}
        </Button>
        <label
          htmlFor={fileId}
          className={buttonVariants({ size: 'sm', variant: 'ghost' })}
        >
          <UploadIcon size={14} aria-hidden className="mr-1.5" />
          SoundFont
        </label>
        <input
          id={fileId}
          name="midi-soundfont"
          type="file"
          accept=".sf2,.sf3,.dls"
          className="sr-only"
          onChange={(e) => void loadBank(e.target.files?.[0])}
        />
      </div>
      {error ? (
        <Alert tone="error" title="The MIDI clip could not be rendered">
          {error}
        </Alert>
      ) : null}
      <PianoRoll
        notes={notes}
        onChange={setNotes}
        fromBeat={fromBeat}
        lengthBeats={lengthBeats}
        gridBeats={gridBeats}
        selectedId={selectedNote}
        onSelect={setSelectedNote}
        className="max-h-80"
      />
      <p className="text-foreground-secondary text-xs">
        Click to add a note, drag to move, drag its right edge to resize,
        double-click or Delete to remove. MIDI clips are silent in the mix until
        you bounce them to audio.
      </p>
    </section>
  );
}
