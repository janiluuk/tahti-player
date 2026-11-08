import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Dialog, Input } from '@tahti-player/ui';

import { AddToPlaylistPanel } from '../components/AddToPlaylistPanel';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { buildTrackPage } from './track-detail/buildTrackPage';
import { DownloadGateDialog } from './track-detail/DownloadGateDialog';
import { TrackBody } from './track-detail/TrackBody';
import { TrackHero } from './track-detail/TrackHero';
import { useTrackDetail } from './track-detail/useTrackDetail';

export function TrackDetailView({
  id,
  shareKey,
}: {
  id: string;
  shareKey?: string;
}) {
  const { t: translate } = useTranslation('web');
  const track = useTrackDetail(id, shareKey);
  const { playable, loading, loadError, retryLoad } = track;

  if (!playable) {
    if (loading) {
      return (
        <div className="flex min-h-full items-center justify-center">
          <PageLoading label={translate('trackDetail.loading')} />
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col py-10">
          <PageError
            title={translate('trackDetail.loadError')}
            description={loadError}
            onRetry={retryLoad}
          />
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-lg flex-col py-10">
        <PageEmpty
          title={translate('trackDetail.unavailableTitle')}
          description={translate('trackDetail.unavailableDescription')}
          action={
            <ButtonLink className="w-fit" to="/" size="sm" variant="secondary">
              {translate('trackDetailView.backToListen')}
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const page = buildTrackPage(track, playable);
  const {
    detail,
    playlistOpen,
    setPlaylistOpen,
    buyBusy,
    pwywOpen,
    setPwywOpen,
    pwywAmt,
    setPwywAmt,
    editOpen,
    setEditOpen,
    reloadDetail,
    canEdit,
    buyTrack,
    downloadGates,
    setDownloadGates,
    downloadTrack,
    user,
  } = page;

  return (
    <div
      className="-mx-6 -mt-6 min-h-full md:-mx-8 md:-mt-8"
      data-testid="track-listen-page"
    >
      <TrackHero page={page} />

      <TrackBody page={page} />

      <AddToPlaylistPanel
        isOpen={playlistOpen}
        soundId={id}
        trackTitle={playable.title}
        onClose={() => setPlaylistOpen(false)}
      />

      <Dialog.Root isOpen={pwywOpen} onClose={() => setPwywOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const eurosN = Number(pwywAmt.replace(',', '.'));
            if (!Number.isFinite(eurosN) || eurosN < 0) {
              toast.error(translate('trackDetail.amountInvalid'));
              return;
            }
            setPwywOpen(false);
            void buyTrack(Math.round(eurosN * 100));
          }}
        >
          <Dialog.Title>{translate('trackDetail.nameYourPrice')}</Dialog.Title>
          <Dialog.Description>
            {translate('trackDetail.pwywDescription', {
              amount: ((detail?.purchaseTierPriceCents ?? 0) / 100).toFixed(2),
            })}
          </Dialog.Description>
          <div className="mt-4">
            <Input
              inputMode="decimal"
              label={translate('trackDetail.amountLabel')}
              value={pwywAmt}
              onChange={(e) => setPwywAmt(e.target.value)}
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{translate('actions.cancel')}</Dialog.Close>
            <Button type="submit" disabled={buyBusy}>
              {buyBusy
                ? translate('trackDetail.buying')
                : translate('trackDetail.buy')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>

      {downloadGates && detail ? (
        <DownloadGateDialog
          gates={downloadGates}
          channelSlug={detail.channelSlug}
          soundId={id}
          artist={detail.channel}
          signedIn={Boolean(user)}
          onClose={() => setDownloadGates(null)}
          onDownload={() => void downloadTrack(true)}
        />
      ) : null}

      {canEdit ? (
        <TrackEditDialog
          soundId={editOpen ? id : null}
          onClose={() => setEditOpen(false)}
          onSaved={reloadDetail}
        />
      ) : null}
    </div>
  );
}
