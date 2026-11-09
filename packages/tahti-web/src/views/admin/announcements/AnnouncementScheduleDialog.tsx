import { useEffect, useState } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, Dialog, InlineError, Input, Select } from '@tahti-player/ui';

import type {
  AdminAnnouncementClip,
  AdminAnnouncementScheduleMode,
} from '../../../api/admin';

const EVERY_NTH_MIN = 2;
const EVERY_NTH_MAX = 100;
const EVERY_NTH_DEFAULT = 4;

export type AnnouncementSchedule = {
  scheduleMode: AdminAnnouncementScheduleMode;
  everyNth: number | null;
};

/** The clip's schedule as one line of text, e.g. "Once every 4 clips". */
export function announcementScheduleLabel(
  clip: AnnouncementSchedule,
  t: TFunction<'web'>,
): string {
  switch (clip.scheduleMode) {
    case 'EVERY_NTH':
      return t('adminAnnouncements.everyNthSummary', {
        count: clip.everyNth ?? EVERY_NTH_DEFAULT,
      });
    case 'RANDOM':
      return t('adminAnnouncementsView.randomly');
    default:
      return t('adminAnnouncementsView.afterEveryClip');
  }
}

export function AnnouncementScheduleDialog({
  clip,
  onClose,
  onSave,
}: {
  clip: AdminAnnouncementClip | null;
  onClose: () => void;
  onSave: (clip: AdminAnnouncementClip, schedule: AnnouncementSchedule) => void;
}) {
  const { t } = useTranslation('web');
  const [mode, setMode] =
    useState<AdminAnnouncementScheduleMode>('AFTER_EVERY');
  const [everyNth, setEveryNth] = useState(String(EVERY_NTH_DEFAULT));

  useEffect(() => {
    if (clip) {
      setMode(clip.scheduleMode);
      setEveryNth(String(clip.everyNth ?? EVERY_NTH_DEFAULT));
    }
  }, [clip]);

  const parsed = Number(everyNth);
  const everyNthValid =
    everyNth.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= EVERY_NTH_MIN &&
    parsed <= EVERY_NTH_MAX;
  const canSave = mode !== 'EVERY_NTH' || everyNthValid;

  return (
    <Dialog.Root isOpen={clip !== null} onClose={onClose} className="max-w-md">
      <Dialog.Title>
        {t('adminAnnouncements.scheduleTitle', { title: clip?.title ?? '' })}
      </Dialog.Title>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!clip || !canSave) {
            return;
          }
          onSave(clip, {
            scheduleMode: mode,
            everyNth: mode === 'EVERY_NTH' ? parsed : null,
          });
        }}
      >
        <Select
          label={t('adminAnnouncements.schedule')}
          value={mode}
          onValueChange={(value) =>
            setMode(value as AdminAnnouncementScheduleMode)
          }
          options={[
            {
              id: 'AFTER_EVERY',
              label: t('adminAnnouncementsView.afterEveryClip'),
            },
            {
              id: 'EVERY_NTH',
              label: t('adminAnnouncementsView.everyNthClip'),
            },
            { id: 'RANDOM', label: t('adminAnnouncementsView.randomly') },
          ]}
        />
        {mode === 'EVERY_NTH' ? (
          <Input
            type="number"
            inputMode="numeric"
            variant="number"
            size="sm"
            min={EVERY_NTH_MIN}
            max={EVERY_NTH_MAX}
            label={t('everyNthInputText.everyNth')}
            value={everyNth}
            onChange={(event) => setEveryNth(event.target.value)}
            className="w-24"
          />
        ) : null}
        {mode === 'EVERY_NTH' && !everyNthValid ? (
          <InlineError>
            {t('adminAnnouncements.everyNthRange', {
              min: EVERY_NTH_MIN,
              max: EVERY_NTH_MAX,
            })}
          </InlineError>
        ) : null}
        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={!canSave}>
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </Dialog.Root>
  );
}
