import { Button, FilterChips, Slider } from '@tahti-player/ui';

import type { EditList, ProEditorPluginId } from '../../../api/studio-types';
import { FILTER_MODES, FILTER_SLOPES, FilterCurve } from './pluginUi';

type Props = {
  id: ProEditorPluginId;
  editList: EditList;
  onChange: (next: EditList) => void;
};

/** The parameter controls of one audio add-on in the mastering chain. */
export function PluginControls({ id, editList, onChange }: Props) {
  if (id === 'eq') {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {editList.eq.bands.map((band, i) => (
          <Slider
            key={band.freq}
            label={`${band.freq} Hz gain`}
            value={band.gainDb}
            min={-12}
            max={12}
            step={0.5}
            unit="dB"
            showFooter={false}
            onValueChange={(gainDb) =>
              onChange({
                ...editList,
                eq: {
                  ...editList.eq,
                  bands: editList.eq.bands.map((entry, idx) =>
                    idx === i ? { ...entry, gainDb } : entry,
                  ),
                },
              })
            }
          />
        ))}
      </div>
    );
  }

  if (id === 'comp') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Slider
          label="Threshold"
          value={editList.comp.thresholdDb}
          min={-40}
          max={0}
          step={1}
          unit="dB"
          showFooter={false}
          onValueChange={(thresholdDb) =>
            onChange({ ...editList, comp: { ...editList.comp, thresholdDb } })
          }
        />
        <Slider
          label="Ratio"
          value={editList.comp.ratio}
          min={1}
          max={20}
          step={0.5}
          unit=":1"
          showFooter={false}
          onValueChange={(ratio) =>
            onChange({ ...editList, comp: { ...editList.comp, ratio } })
          }
        />
      </div>
    );
  }

  if (id === 'limiter') {
    return (
      <Slider
        label="Ceiling"
        value={editList.limiter.ceilingDb}
        min={-6}
        max={0}
        step={0.1}
        unit="dB"
        showFooter={false}
        className="max-w-xs"
        onValueChange={(ceilingDb) =>
          onChange({ ...editList, limiter: { ...editList.limiter, ceilingDb } })
        }
      />
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
        <Slider
          label="Freq"
          value={editList.filter.freq}
          min={20}
          max={20000}
          step={10}
          unit="Hz"
          showFooter={false}
          onValueChange={(freq) =>
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
