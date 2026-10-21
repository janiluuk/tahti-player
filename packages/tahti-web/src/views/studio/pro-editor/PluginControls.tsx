import { Button, FilterChips, Slider } from '@tahti-player/ui';

import type { EditList, ProEditorPluginId } from '../../../api/studio-types';
import {
  FILTER_MODES,
  FILTER_SLOPES,
  FilterCurve,
  formatHz,
  fromLogPosition,
  LOG_STEPS,
  toLogPosition,
} from './pluginUi';

type Props = {
  id: ProEditorPluginId;
  editList: EditList;
  onChange: (next: EditList) => void;
};

/** A frequency slider on a log scale (20 Hz-20 kHz), like a hardware
 * EQ knob: equal travel per octave instead of 10 Hz steps. */
function FrequencySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (hz: number) => void;
}) {
  return (
    <Slider
      label={label}
      value={toLogPosition(value)}
      min={0}
      max={LOG_STEPS}
      step={1}
      showFooter={false}
      formatValue={(position) => formatHz(fromLogPosition(position))}
      onValueChange={(position) => onChange(fromLogPosition(position))}
    />
  );
}

/** The parameter controls of one audio add-on in the mastering chain.
 * Ranges match what the render accepts (`@tahti/audio-edit` schema). */
export function PluginControls({ id, editList, onChange }: Props) {
  if (id === 'eq') {
    const setBand = (
      index: number,
      patch: Partial<EditList['eq']['bands'][number]>,
    ) =>
      onChange({
        ...editList,
        eq: {
          ...editList.eq,
          bands: editList.eq.bands.map((entry, i) =>
            i === index ? { ...entry, ...patch } : entry,
          ),
        },
      });
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {editList.eq.bands.map((band, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p className="text-foreground-secondary text-xs uppercase">
              Band {i + 1}
            </p>
            <FrequencySlider
              label="Freq"
              value={band.freq}
              onChange={(freq) => setBand(i, { freq })}
            />
            <Slider
              label="Gain"
              value={band.gainDb}
              min={-24}
              max={24}
              step={0.5}
              unit="dB"
              showFooter={false}
              onValueChange={(gainDb) => setBand(i, { gainDb })}
            />
            <Slider
              label="Q"
              value={band.q}
              min={0.1}
              max={10}
              step={0.1}
              showFooter={false}
              onValueChange={(q) => setBand(i, { q })}
            />
          </div>
        ))}
      </div>
    );
  }

  if (id === 'comp') {
    const setComp = (patch: Partial<EditList['comp']>) =>
      onChange({ ...editList, comp: { ...editList.comp, ...patch } });
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider
          label="Threshold"
          value={editList.comp.thresholdDb}
          min={-60}
          max={0}
          step={1}
          unit="dB"
          showFooter={false}
          onValueChange={(thresholdDb) => setComp({ thresholdDb })}
        />
        <Slider
          label="Ratio"
          value={editList.comp.ratio}
          min={1}
          max={20}
          step={0.5}
          unit=":1"
          showFooter={false}
          onValueChange={(ratio) => setComp({ ratio })}
        />
        <Slider
          label="Attack"
          value={editList.comp.attackMs}
          min={0.1}
          max={500}
          step={0.1}
          unit="ms"
          showFooter={false}
          onValueChange={(attackMs) => setComp({ attackMs })}
        />
        <Slider
          label="Release"
          value={editList.comp.releaseMs}
          min={1}
          max={5000}
          step={1}
          unit="ms"
          showFooter={false}
          onValueChange={(releaseMs) => setComp({ releaseMs })}
        />
        <Slider
          label="Makeup"
          value={editList.comp.makeupDb}
          min={0}
          max={24}
          step={0.5}
          unit="dB"
          showFooter={false}
          onValueChange={(makeupDb) => setComp({ makeupDb })}
        />
      </div>
    );
  }

  if (id === 'limiter') {
    const setLimiter = (patch: Partial<EditList['limiter']>) =>
      onChange({ ...editList, limiter: { ...editList.limiter, ...patch } });
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider
          label="Ceiling"
          value={Math.max(-3, editList.limiter.ceilingDb)}
          min={-3}
          max={0}
          step={0.1}
          unit="dB"
          showFooter={false}
          onValueChange={(ceilingDb) => setLimiter({ ceilingDb })}
        />
        <Slider
          label="Release"
          value={editList.limiter.releaseMs}
          min={1}
          max={1000}
          step={1}
          unit="ms"
          showFooter={false}
          onValueChange={(releaseMs) => setLimiter({ releaseMs })}
        />
      </div>
    );
  }

  if (id === 'filter') {
    const selectedMode = FILTER_MODES.find(
      (option) => option.id === editList.filter.mode,
    );
    return (
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-foreground-secondary mb-2 text-xs uppercase">
            Filter type
          </p>
          <FilterChips
            aria-label="Filter type"
            items={FILTER_MODES.map((option) => ({
              id: option.id,
              label: option.label,
            }))}
            selected={editList.filter.mode}
            onChange={(mode) => {
              const next = FILTER_MODES.find((option) => option.id === mode);
              if (next) {
                onChange({
                  ...editList,
                  filter: { ...editList.filter, mode: next.id },
                });
              }
            }}
          />
          {selectedMode ? (
            <div className="border-border mt-2 flex justify-center rounded border p-2">
              <FilterCurve path={selectedMode.path} />
            </div>
          ) : null}
        </div>
        <FrequencySlider
          label="Freq"
          value={editList.filter.freq}
          onChange={(freq) =>
            onChange({ ...editList, filter: { ...editList.filter, freq } })
          }
        />
        <div>
          <p className="text-foreground-secondary mb-2 text-xs uppercase">
            Slope
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTER_SLOPES.map((option) => {
              const active = editList.filter.slope === option.id;
              return (
                <Button
                  key={option.id}
                  size="sm"
                  variant={active ? 'default' : 'secondary'}
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      ...editList,
                      filter: { ...editList.filter, slope: option.id },
                    })
                  }
                >
                  <FilterCurve path={option.path} />
                  <span className="ml-2">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
