import { Input, Toggle } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import {
  BPM_MAX,
  BPM_MIN,
  bpmError,
  detectedSummary,
  MIX_VERSION_MAX_LENGTH,
  mixVersionError,
  MUSICAL_KEY_MAX_LENGTH,
  musicalKeyError,
  type TrackAnalysisForm,
} from './trackAnalysisFields';

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-foreground-secondary block text-xs">{hint}</span>
      </span>
      <Toggle label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

/** BPM, key, version and the AI-generated label for one track. */
export function TrackAnalysisSection({
  item,
  value,
  onChange,
  showMusicFields,
}: {
  item: Pick<StudioSound, 'bpmDetected' | 'keyDetected'>;
  value: TrackAnalysisForm;
  onChange: (next: TrackAnalysisForm) => void;
  showMusicFields: boolean;
}) {
  const set = (patch: Partial<TrackAnalysisForm>) =>
    onChange({ ...value, ...patch });
  const detected = detectedSummary(item);

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-4 text-sm">
      {showMusicFields ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              label="BPM"
              inputMode="numeric"
              min={BPM_MIN}
              max={BPM_MAX}
              step={1}
              placeholder="118"
              value={value.bpm}
              disabled={value.useDetectedBpmKey}
              error={bpmError(value.bpm) ?? undefined}
              onChange={(event) => set({ bpm: event.target.value })}
            />
            <Input
              label="Key"
              placeholder="Am, F#m or 8A"
              maxLength={MUSICAL_KEY_MAX_LENGTH}
              value={value.musicalKey}
              disabled={value.useDetectedBpmKey}
              error={musicalKeyError(value.musicalKey) ?? undefined}
              onChange={(event) => set({ musicalKey: event.target.value })}
            />
            <Input
              label="Version"
              placeholder="Original Mix"
              maxLength={MIX_VERSION_MAX_LENGTH}
              value={value.mixVersion}
              error={mixVersionError(value.mixVersion) ?? undefined}
              onChange={(event) => set({ mixVersion: event.target.value })}
            />
          </div>
          <ToggleRow
            label="Use detected BPM and key"
            hint={
              detected
                ? `Detected: ${detected}. Turn off to enter your own.`
                : 'Read from file tags or analyzed from the audio after upload.'
            }
            checked={value.useDetectedBpmKey}
            onChange={(useDetectedBpmKey) => set({ useDetectedBpmKey })}
          />
        </>
      ) : null}
      <ToggleRow
        label="Made with generative AI"
        hint="Shows an AI-generated label on the track page."
        checked={value.isAiGenerated}
        onChange={(isAiGenerated) => set({ isAiGenerated })}
      />
    </div>
  );
}
