import { DownloadIcon } from 'lucide-react';

import { Button, Toggle } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import {
  AudienceVisibilitySection,
  type TrackVisibility,
} from '../AudienceVisibilitySection';
import { PurchaseAccessSection } from '../PurchaseAccessSection';
import { SoundShareLinksSection } from '../SoundShareLinksSection';
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
  const {
    form,
    setForm,
    purchaseTierId,
    setPurchaseTierId,
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
        Choose where this track can appear and whether it can be selected for
        shared programming.
      </p>
      <AudienceVisibilitySection
        visibility={(form.visibility ?? 'PUBLIC') as TrackVisibility}
        onVisibilityChange={(visibility) =>
          setForm({ ...form, visibility, isPublic: visibility === 'PUBLIC' })
        }
        tierIds={form.fanTierIds ?? []}
        onTierIdsChange={(fanTierIds) => setForm({ ...form, fanTierIds })}
      />
      <PurchaseAccessSection
        purchaseTierId={purchaseTierId}
        onPurchaseTierIdChange={setPurchaseTierId}
      />
      {form.visibility === 'PRIVATE' || form.visibility === 'STASH' ? (
        <SoundShareLinksSection soundId={soundId} />
      ) : null}
      <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
        <span className="font-medium">Allow downloads</span>
        <Toggle
          label="Allow downloads"
          checked={form.downloadsEnabled ?? false}
          onChange={(downloadsEnabled) =>
            setForm({ ...form, downloadsEnabled })
          }
        />
      </div>
      {item.embedProvider === 'HEARTHIS' && form.downloadsEnabled ? (
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
      <div className="border-border bg-background-secondary/30 flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
        <span className="font-medium">Allow comments</span>
        <Toggle
          label="Allow comments"
          checked={form.commentsEnabled ?? true}
          onChange={(commentsEnabled) => setForm({ ...form, commentsEnabled })}
        />
      </div>
      {!isAudioClip ? (
        <div className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">
                Add to my channel&apos;s rotation
              </span>
              <span className="text-foreground-secondary block text-xs">
                Plays automatically on your channel when you aren&apos;t live,
                so listeners always hear something instead of dead air.
              </span>
            </span>
            <Toggle
              label="Add to my channel's rotation"
              checked={form.isFallback ?? false}
              onChange={(isFallback) => setForm({ ...form, isFallback })}
            />
          </div>

          <div className="border-border/60 flex items-center gap-3 border-t pt-3">
            <div className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">Tahti Radio rotation</span>
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
            Allow discovery analytics and top lists
          </span>
          <span className="text-foreground-secondary block text-xs">
            Allow eligible listener activity to contribute to discovery lists.
          </span>
        </span>
        <Toggle
          label="Allow discovery analytics and top lists"
          checked={form.topListsEligible ?? true}
          onChange={(topListsEligible) =>
            setForm({ ...form, topListsEligible })
          }
        />
      </div>
      <div className="border-border flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
        <span>
          <span className="block font-medium">Allow Tahti Selects</span>
          <span className="text-foreground-secondary block text-xs">
            Let the Tahti team consider this track for curated Tahti Selects
            programming.
          </span>
        </span>
        <Toggle
          label="Allow Tahti Selects"
          checked={form.selectsOptIn ?? false}
          onChange={(selectsOptIn) => setForm({ ...form, selectsOptIn })}
        />
      </div>
    </div>
  );
}
