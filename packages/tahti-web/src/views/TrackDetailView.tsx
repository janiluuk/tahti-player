import { toast } from 'sonner';

import { Button, ButtonLink, Dialog, Input } from '@tahti-player/ui';

import { AddToPlaylistPanel } from '../components/AddToPlaylistPanel';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { buildTrackPage } from './track-detail/buildTrackPage';
import { TrackBody } from './track-detail/TrackBody';
import { TrackHero } from './track-detail/TrackHero';
import { useTrackDetail } from './track-detail/useTrackDetail';

export function TrackDetailView({
  id,
  shareKey,
}: {
  id: string;
  /** Present when this page was opened via a PRIVATE/STASH sound's share
   * link (`/t/$id?key=...`, see SoundShareLinksSection). Passed through to
   * every fetch/comment call so the backend can serve the otherwise-private
   * sound and log the visit/interaction to the audit log instead of
   * treating it as public activity. */
  shareKey?: string;
}) {
  const t = useTrackDetail(id, shareKey);
  const { playable, loading } = t;

  if (!playable) {
    if (loading) {
      return (
        <div className="flex min-h-full items-center justify-center">
          <PageLoading label="Loading track…" />
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-lg flex-col py-10">
        <PageEmpty
          title="Track unavailable"
          description="This track doesn't exist, isn't public, or was removed."
          action={
            <ButtonLink className="w-fit" to="/" size="sm" variant="secondary">
              Back to Listen
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const page = buildTrackPage(t, playable);
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
              toast.error('Enter an amount of €0 or more.');
              return;
            }
            setPwywOpen(false);
            void buyTrack(Math.round(eurosN * 100));
          }}
        >
          <Dialog.Title>Name your price</Dialog.Title>
          <Dialog.Description>
            The artist set €
            {((detail?.purchaseTierPriceCents ?? 0) / 100).toFixed(2)} as a
            suggestion — pay that, more, or less (down to €0).
          </Dialog.Description>
          <div className="mt-4">
            <Input
              label="Amount (€)"
              value={pwywAmt}
              onChange={(e) => setPwywAmt(e.target.value)}
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>Cancel</Dialog.Close>
            <Button type="submit" disabled={buyBusy}>
              {buyBusy ? 'Buying…' : 'Buy this track'}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>

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
