import {
  ImageIcon,
  ListPlusIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  EditIconButton,
  SaveButton,
  Tooltip,
} from '@tahti-player/ui';

import type { StudioCollection } from '../../../api/studio-types';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../../../components/EntitySocialHeader';
import { ImageSlotDeleteBadge } from '../../../components/imageSlot/ImageSlotDeleteBadge';
import { StudioCollectionMoreMenu } from '../../../components/StudioCollectionMoreMenu';
import { collectionStyles } from '../../../content/collectionStyles';
import type { CollectionEditState } from './useCollectionEditState';

export function CollectionHeader({
  col,
  state,
  editing,
  onEditingChange,
}: {
  col: StudioCollection;
  state: CollectionEditState;
  editing: boolean;
  onEditingChange: (next: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const {
    name,
    coverUrl,
    backdropUrl,
    slideshowImages,
    description,
    style,
    visibility,
    items,
    saving,
    isAlbumLike,
    backdropChrome,
    setUploadTarget,
    setPendingCoverDelete,
    saveMeta,
    playAllTracks,
    queueAllTracks,
    setAddPickerOpen,
  } = state;

  const headerStats: EntitySocialStat[] =
    items.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: items.length,
            icon: MusicIcon,
          },
        ]
      : [];

  return (
    <EntitySocialHeader
      title={name || col.name}
      imageUrl={coverUrl}
      imageAlt=""
      onImageClick={editing ? () => setUploadTarget('cover') : undefined}
      onImageDelete={
        editing && coverUrl ? () => setPendingCoverDelete(true) : undefined
      }
      backdropUrl={backdropUrl}
      subtitle={
        <>
          {collectionStyles(t).find((s) => s.id === style)?.label ?? style}
          {slideshowImages.length > 1
            ? ` · ${slideshowImages.length}-image backdrop slideshow`
            : ''}
        </>
      }
      description={description.trim() || undefined}
      stats={headerStats}
      actions={
        <>
          {editing ? (
            <div className="group relative">
              <Tooltip
                content={backdropUrl ? 'Preview backdrop' : 'Change backdrop'}
                side="top"
              >
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                  aria-label={
                    backdropUrl ? 'Preview backdrop' : 'Change backdrop'
                  }
                  onClick={() =>
                    backdropUrl
                      ? backdropChrome.openPreview()
                      : setUploadTarget('backdrop')
                  }
                >
                  <ImageIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
              {backdropUrl ? (
                <ImageSlotDeleteBadge
                  label={t('collectionHeader.backdrop')}
                  onClick={backdropChrome.requestDelete}
                />
              ) : null}
            </div>
          ) : null}
          <Badge
            variant="pill"
            color={visibility === 'PUBLIC' ? 'green' : 'secondary'}
          >
            {visibility.charAt(0) + visibility.slice(1).toLowerCase()}
          </Badge>
          {editing ? (
            <SaveButton saving={saving} onClick={() => void saveMeta()} />
          ) : null}
          <EditIconButton
            label={t('collectionHeader.editDetails')}
            editing={editing}
            onClick={() => onEditingChange(!editing)}
          />
        </>
      }
      data-testid="studio-collection-social-header"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => void playAllTracks()}
          disabled={items.length === 0}
        >
          <PlayIcon size={16} aria-hidden className="mr-1.5" />
          {t('collectionHeader.play')}
        </Button>
        <Tooltip content={t('collectionHeader.addAllToQueue')} side="top">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => void queueAllTracks()}
            disabled={items.length === 0}
            aria-label={t('collectionHeader.addAllToQueue')}
          >
            <ListPlusIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
        {editing ? (
          <Tooltip
            content={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
            side="top"
          >
            <Button
              variant="secondary"
              size="icon"
              aria-label={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
              onClick={() => setAddPickerOpen(true)}
            >
              <PlusIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
        <StudioCollectionMoreMenu
          col={col}
          kindLabel={isAlbumLike ? 'album' : 'collection'}
        />
      </div>
    </EntitySocialHeader>
  );
}
