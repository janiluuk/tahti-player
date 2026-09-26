import { useNavigate } from '@tanstack/react-router';
import { FC, useCallback, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  Input,
  QueueHeaderActions as QueueHeaderActionsView,
  QueuePanel,
} from '@tahti-player/ui';

import { useCurrentQueueItem } from '../hooks/useCurrentQueueItem';
import { useQueue } from '../hooks/useQueue';
import { useQueueActions } from '../hooks/useQueueActions';
import { usePlaylistStore } from '../stores/playlistStore';

type ConnectedQueuePanelProps = {
  isCollapsed?: boolean;
};

export const ConnectedQueuePanel: FC<ConnectedQueuePanelProps> = ({
  isCollapsed = false,
}) => {
  const { t } = useTranslation('queue');
  const queue = useQueue();
  const currentItem = useCurrentQueueItem();
  const { goToId, removeByIds, reorder, selectCandidate } = useQueueActions();

  const handleRemoveItem = useCallback(
    (itemId: string) => removeByIds([itemId]),
    [removeByIds],
  );

  const labels = useMemo(
    () => ({
      emptyTitle: t('empty.title'),
      emptySubtitle: t('empty.subtitle'),
      removeButton: t('actions.remove'),
      playbackError: t('errors.playback'),
      noCandidates: t('candidates.empty'),
      candidateFailed: t('candidates.failed'),
    }),
    [t],
  );

  return (
    <QueuePanel
      items={queue.items}
      currentItemId={currentItem?.id}
      isCollapsed={isCollapsed}
      reorderable={!isCollapsed}
      onReorder={reorder}
      onSelectItem={goToId}
      onRemoveItem={handleRemoveItem}
      onSelectCandidate={selectCandidate}
      labels={labels}
    />
  );
};

export const QueueHeaderActions: FC = () => {
  const { t } = useTranslation('queue');
  const { t: tPlaylists } = useTranslation('playlists');
  const navigate = useNavigate();
  const queue = useQueue();
  const { clearQueue } = useQueueActions();
  const saveQueueAsPlaylist = usePlaylistStore(
    (state) => state.saveQueueAsPlaylist,
  );

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  const handleSaveAsPlaylist = async () => {
    if (!playlistName.trim()) {
      return;
    }
    const playlistId = await saveQueueAsPlaylist(playlistName.trim());
    setSaveDialogOpen(false);
    setPlaylistName('');
    navigate({ to: '/playlists/$playlistId', params: { playlistId } });
  };

  if (queue.items.length === 0) {
    return null;
  }

  return (
    <>
      <QueueHeaderActionsView
        onClearQueue={clearQueue}
        menuItems={[
          {
            id: 'save-as-playlist',
            label: t('actions.saveAsPlaylist'),
            onClick: () => setSaveDialogOpen(true),
          },
        ]}
      />
      <Dialog.Root
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveAsPlaylist();
          }}
        >
          <Dialog.Title>{t('actions.saveAsPlaylist')}</Dialog.Title>
          <div className="mt-4">
            <Input
              label={tPlaylists('name')}
              placeholder={tPlaylists('namePlaceholder')}
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              data-testid="save-queue-playlist-name-input"
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('common:actions.cancel')}</Dialog.Close>
            <Button type="submit">{t('common:actions.save')}</Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </>
  );
};
