import { DiscIcon } from 'lucide-react';

import { Button, Popover, Select, Toggle } from '@tahti-player/ui';

import { KEY_NOTATIONS, type KeyNotation } from '../../lib/musicalKey';
import {
  BPM_TOLERANCES,
  useDjPrefsStore,
  type BpmTolerance,
} from '../../stores/djPrefsStore';

export function DjSettingsPopover() {
  const keyNotation = useDjPrefsStore((state) => state.keyNotation);
  const setKeyNotation = useDjPrefsStore((state) => state.setKeyNotation);
  const bpmTolerance = useDjPrefsStore((state) => state.bpmTolerance);
  const setBpmTolerance = useDjPrefsStore((state) => state.setBpmTolerance);
  const halfDouble = useDjPrefsStore((state) => state.halfDouble);
  const setHalfDouble = useDjPrefsStore((state) => state.setHalfDouble);
  return (
    <Popover
      anchor="bottom end"
      panelClassName="w-80"
      tooltip={{ content: 'DJ settings', side: 'top' }}
      trigger={
        <Button size="icon-sm" variant="text" aria-label="DJ settings">
          <DiscIcon size={14} aria-hidden />
        </Button>
      }
    >
      <div className="flex flex-col gap-3" data-testid="dj-settings">
        <p className="text-sm font-semibold">DJ settings</p>
        <Select
          label="Key notation"
          description="How keys show in the list and track details."
          options={[...KEY_NOTATIONS]}
          value={keyNotation}
          onValueChange={(value) => setKeyNotation(value as KeyNotation)}
        />
        <Select
          label="Tempo range for mixable tracks"
          description="How far a track's BPM may be from the one you're playing."
          options={BPM_TOLERANCES.map((value) => ({
            id: String(value),
            label: `±${value}%`,
          }))}
          value={String(bpmTolerance)}
          onValueChange={(value) =>
            setBpmTolerance(Number(value) as BpmTolerance)
          }
        />
        <Toggle
          label="Count half and double tempo"
          showLabel
          labelPosition="start"
          description="A 70 BPM track then matches a 140 BPM one."
          checked={halfDouble}
          onChange={setHalfDouble}
        />
      </div>
    </Popover>
  );
}
