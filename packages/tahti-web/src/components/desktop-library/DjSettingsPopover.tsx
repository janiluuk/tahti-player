import { DiscIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Popover, Select, Toggle } from '@tahti-player/ui';

import { KEY_NOTATIONS, type KeyNotation } from '../../lib/musicalKey';
import {
  BPM_TOLERANCES,
  useDjPrefsStore,
  type BpmTolerance,
} from '../../stores/djPrefsStore';

export function DjSettingsPopover() {
  const { t } = useTranslation('web');
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
        <Button
          size="icon-sm"
          variant="text"
          aria-label={t('djSettings.djSettings')}
        >
          <DiscIcon size={14} aria-hidden />
        </Button>
      }
    >
      <div className="flex flex-col gap-3" data-testid="dj-settings">
        <p className="text-sm font-semibold">{t('djSettings.djSettings')}</p>
        <Select
          label={t('djSettings.keyNotation')}
          description={t('djSettings.howKeysShowInThe')}
          options={[...KEY_NOTATIONS]}
          value={keyNotation}
          onValueChange={(value) => setKeyNotation(value as KeyNotation)}
        />
        <Select
          label={t('djSettings.tempoRangeForMixableTracks')}
          description={t('djSettings.howFarATrackS')}
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
          label={t('djSettings.countHalfAndDoubleTempo')}
          showLabel
          labelPosition="start"
          description={t('djSettings.a70BpmTrackThen')}
          checked={halfDouble}
          onChange={setHalfDouble}
        />
      </div>
    </Popover>
  );
}
