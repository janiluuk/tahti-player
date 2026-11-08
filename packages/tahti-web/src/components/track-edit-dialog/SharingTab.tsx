import { DownloadIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Toggle } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import {
  AudienceVisibilitySection,
  visibilityFromIsPublic,
} from '../AudienceVisibilitySection';
import { DownloadsSwitch } from '../DownloadsSwitch';
import { PurchaseAccessSection } from '../PurchaseAccessSection';
import { SoundShareLinksSection } from '../SoundShareLinksSection';
import { DownloadGateSection } from './DownloadGateSection';
import { HearthisEmbedImport } from './HearthisEmbedImport';
import type { TrackEditDialogState } from './useTrackEditDialog';

export function SharingTab({
  soundId,
  item,
  state,
}: {
  soundId: string;
  item: StudioSound;
  state: TrackEditDialogState;
}) {
  const { t } = useTranslation('web');
  const {
    form,
    setForm,
    access,
    setAccess,
    isAudioClip,
    downloadingEmbed,
    downloadHearthisEmbed,
    radioSubmission,
    submittingToRadio,
    submitToRadioRotation,
  } = state;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground-secondary text-xs">
        {t('trackSharing.chooseWhereThisTrackCan')}
      </p>
      <AudienceVisibilitySection
        visibility={visibilityFromIsPublic(form.isPublic)}
        onVisibilityChange={(visibility) =>
          setForm({ ...form, isPublic: visibility === 'PUBLIC' })
        }
      />
      <PurchaseAccessSection access={access} onAccessChange={setAccess} />
      {form.isPublic === false ? (
        <SoundShareLinksSection soundId={soundId} />
      ) : null}
      {!item.embedProvider ? (
        <>
          <DownloadsSwitch
            enabled={form.downloadsEnabled}
            onChange={(downloadsEnabled) =>
              setForm({ ...form, downloadsEnabled })
            }
          />
          {form.downloadsEnabled !== false ? (
            <DownloadGateSection
              soundId={soundId}
              followToDownload={form.followToDownload ?? false}
              repostToDownload={form.repostToDownload ?? false}
              onChange={(patch) => setForm({ ...form, ...patch })}
            />
          ) : null}
        </>
      ) : null}
      {item.embedProvider === 'HEARTHIS' ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={downloadingEmbed}
          onClick={() => void downloadHearthisEmbed()}
        >
          <DownloadIcon size={15} aria-hidden className="mr-1.5" />
          {downloadingEmbed ? 'Preparing download…' : 'Download from HearThis'}
        </Button>
      ) : null}
      {item.embedProvider === 'HEARTHIS' ? (
        <HearthisEmbedImport soundId={soundId} />
      ) : null}
      <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
        <span className="font-medium">{t('trackSharing.allowComments')}</span>
        <Toggle
          label={t('trackSharing.allowComments')}
          checked={form.commentsEnabled ?? true}
          onChange={(commentsEnabled) => setForm({ ...form, commentsEnabled })}
        />
      </div>
      {!isAudioClip ? (
        <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">
                {t('trackSharing.addToMyChannelApos')}
              </span>
              <span className="text-foreground-secondary block text-xs">
                {t('trackSharing.playsAutomaticallyOnYourChannel')}
              </span>
            </span>
            <Toggle
              label={t('trackSharing.addToMyChannelS')}
              checked={form.isFallback ?? false}
              onChange={(isFallback) => setForm({ ...form, isFallback })}
            />
          </div>

          <div className="border-border/60 flex items-center gap-3 border-t pt-3">
            <div className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">
                {t('trackSharing.tahtiRadioRotation')}
              </span>
              <span className="text-foreground-secondary block text-xs">
                {radioSubmission?.status === 'PENDING'
                  ? 'Submitted — waiting on board review.'
                  : radioSubmission?.status === 'APPROVED'
                    ? 'Approved — in the Tahti Radio rotation.'
                    : radioSubmission?.status === 'REJECTED'
                      ? (radioSubmission.rejectionNote ??
                        'Not accepted this time — you can resubmit.')
                      : 'Submit for board review to be considered for the shared 24/7 station.'}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={
                submittingToRadio ||
                radioSubmission?.status === 'PENDING' ||
                radioSubmission?.status === 'APPROVED'
              }
              onClick={submitToRadioRotation}
            >
              {submittingToRadio
                ? 'Submitting…'
                : radioSubmission?.status === 'PENDING'
                  ? 'Pending'
                  : radioSubmission?.status === 'APPROVED'
                    ? 'In rotation'
                    : radioSubmission?.status === 'REJECTED'
                      ? 'Resubmit'
                      : 'Submit'}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>
          <span className="block font-medium">
            {t('trackSharing.allowDiscoveryAnalyticsAndTop')}
          </span>
          <span className="text-foreground-secondary block text-xs">
            {t('trackSharing.allowEligibleListenerActivityTo')}
          </span>
        </span>
        <Toggle
          label={t('trackSharing.allowDiscoveryAnalyticsAndTop')}
          checked={form.topListsEligible ?? true}
          onChange={(topListsEligible) =>
            setForm({ ...form, topListsEligible })
          }
        />
      </div>
      <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>
          <span className="block font-medium">
            {t('trackSharing.allowTahtiSelects')}
          </span>
          <span className="text-foreground-secondary block text-xs">
            {t('trackSharing.letTheTahtiTeamConsider')}
          </span>
        </span>
        <Toggle
          label={t('trackSharing.allowTahtiSelects')}
          checked={form.selectsOptIn ?? false}
          onChange={(selectsOptIn) => setForm({ ...form, selectsOptIn })}
        />
      </div>
    </div>
  );
}
