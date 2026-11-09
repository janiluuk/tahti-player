import { MicIcon, UploadIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, FilePicker, FilterChips } from '@tahti-player/ui';

import type { StudioShowSeries } from '../../../api/shows';
import { dateLocaleTag } from '../../../lib/locale';
import type { ShowDetailState } from './useShowDetail';

export function NewEpisodeDialog({
  show,
  state,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
}) {
  const { t } = useTranslation('web');
  const {
    createOpen,
    setCreateOpen,
    source,
    setSource,
    file,
    setFile,
    busy,
    nextEpisodeNumber,
    defaultEpisodeTitle,
    nextSlotHint,
    createNewEpisode,
  } = state;

  return (
    <Dialog.Root isOpen={createOpen} onClose={() => setCreateOpen(false)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void createNewEpisode();
        }}
      >
        <Dialog.Title>{t('newEpisode.newEpisode')}</Dialog.Title>
        <Dialog.Description>
          {t('newEpisode.prefillsFromTheShowYou')}
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <div className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
            <p>
              <span className="text-foreground-secondary text-xs uppercase">
                {t('newEpisode.episodeNumber')}
              </span>
              <br />
              <strong className="font-display text-2xl">
                #{nextEpisodeNumber}
              </strong>
            </p>
            <p className="text-foreground-secondary mt-2 text-xs">
              Title: {defaultEpisodeTitle}
            </p>
            {show.description ? (
              <p className="text-foreground-secondary mt-1 line-clamp-2 text-xs">
                Description: {show.description}
              </p>
            ) : null}
            {nextSlotHint ? (
              <p className="text-foreground-secondary mt-1 text-xs">
                Schedule:{' '}
                {new Date(nextSlotHint.startAt).toLocaleString(dateLocaleTag())}
              </p>
            ) : (
              <p className="text-foreground-secondary mt-1 text-xs">
                {t('newEpisode.scheduleBookASlotAfter')}
              </p>
            )}
          </div>

          <FilterChips
            items={[
              {
                id: 'upload',
                label: t('newEpisodeDialog.uploadAudio'),
                icon: <UploadIcon size={14} aria-hidden />,
              },
              {
                id: 'broadcast',
                label: t('newEpisodeDialog.recordFromBroadcast'),
                icon: <MicIcon size={14} aria-hidden />,
              },
            ]}
            selected={source}
            onChange={(id) => setSource(id as 'upload' | 'broadcast')}
            aria-label={t('newEpisode.episodeSource')}
          />

          {source === 'upload' ? (
            <FilePicker
              labels={{
                title: t('newEpisodeDialog.episodeAudio'),
                description: t('newEpisodeDialog.mp3WavFlacOrAiff'),
                browse: file
                  ? t('newEpisodeDialogStates.chooseAnotherFile')
                  : t('newEpisodeDialogStates.chooseAudio'),
              }}
              accept="audio/*,.flac,.wav,.mp3,.aiff"
              selectedFiles={file ? [file] : []}
              onFiles={(files) => setFile(files[0] ?? null)}
            />
          ) : (
            <p className="text-foreground-secondary text-sm">
              {t('newEpisode.createsAPendingEpisodeGo')}
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('newEpisode.cancel')}</Dialog.Close>
          <Button
            type="submit"
            disabled={busy || (source === 'upload' && !file)}
          >
            {busy
              ? 'Creating…'
              : source === 'broadcast'
                ? t('newEpisodeDialogStates.createGoRecord')
                : t('newEpisodeDialogStates.createEpisode')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
