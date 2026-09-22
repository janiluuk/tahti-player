import { Button, Dialog } from '@tahti-player/ui';

import { ConfirmDialog } from '../ConfirmDialog';
import type { StreamManagerState } from './useStreamManagerState';

export function PlaylistDialog({ state }: { state: StreamManagerState }) {
  const {
    playlistDialogOpen,
    setPlaylistDialogOpen,
    collections,
    selectedCollectionSlug,
    previewCollection,
    playlistLoading,
    selectedCollection,
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
        <Dialog.Title>Choose a playlist</Dialog.Title>
        <Dialog.Description>
          Preview a playlist, then add it to the rotation or replace the current
          rotation with it.
        </Dialog.Description>
        <div className="grid gap-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="border-border flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border p-1">
            {collections.map((collection) => (
              <button
                key={collection.slug}
                type="button"
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  selectedCollectionSlug === collection.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-background-secondary'
                }`}
                onClick={() => void previewCollection(collection.slug)}
              >
                <span className="block truncate font-semibold">
                  {collection.name}
                </span>
                <span className="block text-xs opacity-75">
                  {collection.itemCount ?? collection.items?.length ?? 0} tracks
                </span>
              </button>
            ))}
          </div>
          <div className="border-border min-h-32 rounded-lg border p-3">
            {playlistLoading ? (
              <p className="text-foreground-secondary text-sm">
                Loading playlist…
              </p>
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
                    This playlist has no tracks.
                  </p>
                )}
                {(selectedCollection.items ?? []).length > 0 &&
                  !selectedPlaylistHasRotationTracks && (
                    <p className="text-foreground-secondary mt-2 text-xs">
                      This playlist has no sound tracks that can play in 24/7
                      rotation.
                    </p>
                  )}
              </>
            ) : (
              <p className="text-foreground-secondary text-sm">
                Choose a playlist to preview it.
              </p>
            )}
          </div>
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            variant="secondary"
            disabled={
              !selectedPlaylistHasRotationTracks ||
              playlistLoading ||
              rotationBusy
            }
            onClick={() => setPendingApply({ replace: false })}
          >
            Add to rotation
          </Button>
          <Button
            disabled={
              !selectedPlaylistHasRotationTracks ||
              playlistLoading ||
              rotationBusy
            }
            onClick={() => setPendingApply({ replace: true })}
          >
            Replace rotation
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={pendingApply !== null}
        title={
          pendingApply?.replace
            ? 'Replace the current rotation?'
            : 'Add this playlist to the rotation?'
        }
        description={
          pendingApply?.replace
            ? `This removes every track currently in rotation and replaces it with "${selectedCollection?.name ?? 'this playlist'}".`
            : `This adds "${selectedCollection?.name ?? 'this playlist'}"'s tracks to the current rotation.`
        }
        confirmLabel={
          rotationBusy
            ? pendingApply?.replace
              ? 'Replacing…'
              : 'Adding…'
            : pendingApply?.replace
              ? 'Replace rotation'
              : 'Add to rotation'
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
