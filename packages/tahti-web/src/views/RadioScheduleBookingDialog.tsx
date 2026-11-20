import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilterChips,
  Input,
  SaveButton,
} from '@tahti-player/ui';

import type { ShowType, StudioShowBooking } from '../api/shows';
import { webT } from '../lib/webT';

export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function bookingTitle(booking: StudioShowBooking): string {
  return (
    booking.note ||
    (booking.showType === 'TALK'
      ? webT()('radioScheduleViewStates.talkShow')
      : webT()('radioScheduleViewStates.liveSet'))
  );
}

export function RadioScheduleBookingDialog({
  booking,
  busy,
  cancelConfirming,
  onCancelConfirmingChange,
  editNote,
  onEditNoteChange,
  editShowType,
  onEditShowTypeChange,
  onClose,
  onCancelBooking,
  onSave,
}: {
  booking: StudioShowBooking | null;
  busy: boolean;
  cancelConfirming: boolean;
  onCancelConfirmingChange: (confirming: boolean) => void;
  editNote: string;
  onEditNoteChange: (note: string) => void;
  editShowType: ShowType;
  onEditShowTypeChange: (showType: ShowType) => void;
  onClose: () => void;
  onCancelBooking: (id: string) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={Boolean(booking)} onClose={onClose}>
      {booking &&
        (cancelConfirming ? (
          <>
            <Dialog.Title>{t('radioSchedule.cancelThisBooking')}</Dialog.Title>
            <Dialog.Description>
              {t('radioScheduleViewBatch33.cancelDescription', {
                time: formatHour(new Date(booking.startAt).getHours()),
                date: new Date(booking.startAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }),
              })}
            </Dialog.Description>
            <Dialog.Actions>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => onCancelConfirmingChange(false)}
              >
                {t('radioSchedule.keepBooking')}
              </Button>
              <Button
                intent="danger"
                disabled={busy}
                onClick={() => onCancelBooking(booking.id)}
              >
                {busy
                  ? t('radioScheduleViewStates.cancelling')
                  : t('radioScheduleViewStates.cancelBooking')}
              </Button>
            </Dialog.Actions>
          </>
        ) : (
          <>
            <Dialog.Title>{bookingTitle(booking)}</Dialog.Title>
            <Dialog.Description>
              {new Date(booking.startAt).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              , {formatHour(new Date(booking.startAt).getHours())}–
              {formatHour(new Date(booking.endAt).getHours())}
            </Dialog.Description>
            <form
              className="contents"
              onSubmit={(event) => {
                event.preventDefault();
                onSave();
              }}
            >
              <div className="flex flex-col gap-3">
                {booking.showTitle && (
                  <p className="text-sm">
                    <span className="text-foreground-secondary">
                      {t('radioScheduleViewLeftovers.show')}{' '}
                    </span>
                    {booking.showTitle}
                    {booking.episodeNumber != null
                      ? t('radioScheduleViewLeftovers.episodeNumber', {
                          number: booking.episodeNumber,
                        })
                      : ''}
                  </p>
                )}
                <FilterChips
                  items={[
                    { id: 'LIVE_SET', label: t('radioScheduleView.liveSet') },
                    { id: 'TALK', label: t('radioScheduleView.talk') },
                  ]}
                  selected={editShowType}
                  onChange={(id) => onEditShowTypeChange(id as ShowType)}
                  disabled={busy}
                  aria-label={t('radioSchedule.showType')}
                />
                <Input
                  aria-label={t('radioSchedule.note')}
                  value={editNote}
                  onChange={(e) => onEditNoteChange(e.target.value)}
                  disabled={busy}
                  placeholder={
                    editShowType === 'TALK'
                      ? t('radioScheduleViewBatch33.editNoteTalk')
                      : t('radioScheduleViewBatch33.editNoteSet')
                  }
                />
              </div>
              <Dialog.Actions>
                <Dialog.Close>{t('radioSchedule.close')}</Dialog.Close>
                <Button
                  intent="danger"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onCancelConfirmingChange(true)}
                >
                  {t('radioSchedule.cancelBooking')}
                </Button>
                <SaveButton
                  disabled={busy}
                  saving={busy}
                  label={t('radioSchedule.saveChanges')}
                  type="submit"
                />
              </Dialog.Actions>
            </form>
          </>
        ))}
    </Dialog.Root>
  );
}
