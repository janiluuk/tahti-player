import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, InlineLoader } from '@tahti-player/ui';

import { ConfirmDialog } from '../ConfirmDialog';
import { PageError } from '../PageStates';
import type { StreamManagerState } from './useStreamManagerState';

export function PlaylistDialog({ state }: { state: StreamManagerState }) {
  const { t } = useTranslation('web');
  const {
    playlistDialogOpen,
    setPlaylistDialogOpen,
    collections,
    selectedCollectionSlug,
    previewCollection,
    playlistLoading,
    selectedCollection,
    previewError,
    selectedPlaylistHasRotationTracks,
    rotationBusy,
    pendingApply,
    setPendingApply,
    handleApplyCollectionToRotation,
  } = state;

  return (
    <>
      <Dialog.Root
        isOpen={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
      >
        <Dialog.Title>{t('playlistDialog.chooseAPlaylist')}</Dialog.Title>
        <Dialog.Description>
          {t('playlistDialog.previewAPlaylistThenAdd')}
        </Dialog.Description>
        <div className="grid gap-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="border-border flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
            {collections.map((collection) => (
              <Button
                variant="plain"
                size="flexible"
                key={collection.slug}
                type="button"
                className={`inline-block rounded-md border px-3 py-2 text-left text-sm whitespace-normal active:scale-100 ${
                  selectedCollectionSlug === collection.slug
                    ? 'border-accent-cyan bg-foreground/10'
                    : 'hover:bg-background-secondary border-transparent'
                }`}
                onClick={() => void previewCollection(collection.slug)}
              >
                <span className="block truncate font-semibold">
                  {collection.name}
                </span>
                <span className="block text-xs opacity-75">
                  {collection.itemCount ?? collection.items?.length ?? 0} tracks
                </span>
              </Button>
            ))}
          </div>
          <div className="border-border min-h-32 rounded-lg border p-3">
            {playlistLoading ? (
              <InlineLoader label={t('playlistDialog.loadingPlaylist')} />
            ) : previewError ? (
              <PageError
                title={t('loadErrors.couldNotLoadThisPlaylist')}
                description={previewError}
                onRetry={() => void previewCollection(selectedCollectionSlug)}
              />
            ) : selectedCollection ? (
              <>
                <h3 className="font-semibold">{selectedCollection.name}</h3>
                <ul className="text-foreground-secondary mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {(selectedCollection.items ?? []).map((item) => (
                    <li key={item.id} className="truncate">
                      {item.position + 1}.{' '}
                      {item.sound?.title ??
                        item.release?.title ??
                        'Untitled track'}
                    </li>
                  ))}
                </ul>
                {(selectedCollection.items ?? []).length === 0 && (
                  <p className="text-foreground-secondary mt-2 text-xs">
                    {t('playlistDialog.thisPlaylistHasNoTracks')}
                  </p>
                )}
                {(selectedCollection.items ?? []).length > 0 &&
                  !selectedPlaylistHasRotationTracks && (
                    <p className="text-foreground-secondary mt-2 text-xs">
                      {t('playlistDialog.thisPlaylistHasNoSound')}
                    </p>
                  )}
              </>
            ) : (
              <p className="text-foreground-secondary text-sm">
                {t('playlistDialog.chooseAPlaylistToPreview')}
              </p>
            )}
          </div>
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('playlistDialog.cancel')}</Dialog.Close>
          <Button
            variant="secondary"
            disabled={
              !selectedPlaylistHasRotationTracks ||
              playlistLoading ||
              rotationBusy
            }
            onClick={() => setPendingApply({ replace: false })}
          >
            {t('playlistDialog.addToRotation')}
          </Button>
          <Button
            disabled={
              !selectedPlaylistHasRotationTracks ||
              playlistLoading ||
              rotationBusy
            }
            onClick={() => setPendingApply({ replace: true })}
          >
            {t('playlistDialog.replaceRotation')}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingApply !== null}
        destructive={pendingApply?.replace ?? false}
        title={
          pendingApply?.replace
            ? t('streamManagerPlaylistDialogStates.replaceTheCurrentRotation')
            : t('streamManagerPlaylistDialogStates.addThisPlaylistToThe')
        }
        description={
          pendingApply?.replace
            ? `This removes every track currently in rotation and replaces it with "${selectedCollection?.name ?? 'this playlist'}".`
            : `This adds "${selectedCollection?.name ?? 'this playlist'}"'s tracks to the current rotation.`
        }
        confirmLabel={
          rotationBusy
            ? pendingApply?.replace
              ? t('streamManagerPlaylistDialogStates.replacing')
              : t('streamManagerPlaylistDialogStates.adding')
            : pendingApply?.replace
              ? t('streamManagerPlaylistDialogStates.replaceRotation')
              : t('streamManagerPlaylistDialogStates.addToRotation')
        }
        onCancel={() => setPendingApply(null)}
        onConfirm={() => {
          if (!pendingApply) {
            return;
          }
          const { replace } = pendingApply;
          setPendingApply(null);
          void handleApplyCollectionToRotation(replace);
        }}
      />
    </>
  );
}
