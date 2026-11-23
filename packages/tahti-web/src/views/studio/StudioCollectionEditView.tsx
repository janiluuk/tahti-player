import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  ImageIcon,
  ListMusicIcon,
  Share2Icon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useRef } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import { PageError, PageLoading } from '../../components/PageStates';
import { RestrictionNotice } from '../../components/RestrictionNotice';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { useEditMode } from '../../lib/useEditMode';
import { CollectionDialogs } from './collection-edit/CollectionDialogs';
import { CollectionHeader } from './collection-edit/CollectionHeader';
import { DetailsPanel, SharingPanel } from './collection-edit/DetailsPanel';
import { MikseriImportPanel } from './collection-edit/MikseriImportPanel';
import { MixcloudImportPanel } from './collection-edit/MixcloudImportPanel';
import { SpotifyImportPanel } from './collection-edit/SpotifyImportPanel';
import { TextLayerPanel } from './collection-edit/TextLayerPanel';
import { TracklistPanel } from './collection-edit/TracklistPanel';
import { useCollectionEditState } from './collection-edit/useCollectionEditState';

export type CollectionEditTab = 'tracks' | 'details' | 'artwork' | 'sharing';

export function collectionEditTab(value: unknown): CollectionEditTab {
  return value === 'details' || value === 'artwork' || value === 'sharing'
    ? value
    : 'tracks';
}

export function StudioCollectionEditView({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    edit?: true;
    tab?: string;
  };
  const state = useCollectionEditState(slug);
  const { col, isAlbumLike, loadError, reload } = state;
  const [editing, setEditing] = useEditMode();
  const importPanelsRef = useRef<HTMLDivElement>(null);
  const tab = collectionEditTab(search.tab);

  const setTab = (next: CollectionEditTab) => {
    void navigate({
      to: '/studio/collections/$slug',
      params: { slug },
      search: {
        ...(editing ? { edit: true as const } : {}),
        ...(next === 'tracks' ? {} : { tab: next }),
      },
      replace: true,
    });
  };

  const addTracks = () => {
    if (!editing) {
      setEditing(true);
      return;
    }
    if (tab !== 'tracks') {
      setTab('tracks');
    }
    requestAnimationFrame(() => {
      importPanelsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const tracksContent = (
    <>
      <TracklistPanel
        state={state}
        isAlbumLike={isAlbumLike}
        editing={editing}
        onAddTracks={col?.id ? addTracks : undefined}
      />
      {editing && col?.id ? (
        <div
          ref={importPanelsRef}
          className="flex scroll-mt-4 flex-col gap-6"
          data-testid="collection-import-panels"
        >
          <RestrictionNotice type="UPLOAD" />
          <MixcloudImportPanel
            collectionId={col.id}
            onAdded={() => void state.refreshItems()}
            onUndoAdd={state.removeAddedSound}
          />
          <MikseriImportPanel
            collectionId={col.id}
            onAdded={() => void state.refreshItems()}
            onUndoAdd={state.removeAddedSound}
          />
          <SpotifyImportPanel
            collectionId={col.id}
            onAdded={() => void state.refreshItems()}
            onUndoAdd={state.removeAddedSound}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        <div className="relative flex flex-col gap-6">
          <Tooltip
            content={t('studioCollectionEditView.backToCollections')}
            side="right"
            wrapperClassName={backButtonCornerClassName}
          >
            <BackButtonLink
              to="/studio/collections"
              aria-label={t('studioCollectionEditView.backToCollections')}
            />
          </Tooltip>
          {!col && loadError ? (
            <StudioPanel>
              <PageError
                title={t('loadErrors.couldNotLoadThisCollection')}
                description={loadError}
                onRetry={reload}
              />
            </StudioPanel>
          ) : !col ? (
            <StudioPanel>
              <PageLoading label={t('loading.loading')} />
            </StudioPanel>
          ) : (
            <>
              <CollectionHeader
                col={col}
                state={state}
                editing={editing}
                onEditingChange={setEditing}
              />
              {editing ? (
                <Tabs
                  selectedIndex={
                    tab === 'details'
                      ? 1
                      : tab === 'artwork'
                        ? 2
                        : tab === 'sharing'
                          ? 3
                          : 0
                  }
                  onChange={(index) => {
                    const next: CollectionEditTab =
                      index === 1
                        ? 'details'
                        : index === 2
                          ? 'artwork'
                          : index === 3
                            ? 'sharing'
                            : 'tracks';
                    setTab(next);
                  }}
                  listClassName="flex-wrap"
                  panelClassName="pt-2"
                  items={[
                    {
                      id: 'tracks',
                      label: t('studioCollectionEditView.tracks'),
                      icon: <ListMusicIcon size={14} />,
                      content: tracksContent,
                    },
                    {
                      id: 'details',
                      label: t('collectionDetails.details'),
                      icon: <SlidersHorizontalIcon size={14} />,
                      content: <DetailsPanel state={state} />,
                    },
                    {
                      id: 'artwork',
                      label: t('studioCollectionEditView.artwork'),
                      icon: <ImageIcon size={14} />,
                      content: (
                        <div className="flex flex-col gap-4">
                          <p className="text-foreground-secondary text-sm">
                            {t('studioCollectionEditView.artworkHint')}
                          </p>
                          <TextLayerPanel slug={slug} />
                        </div>
                      ),
                    },
                    {
                      id: 'sharing',
                      label: t('studioCollectionEditView.sharing'),
                      icon: <Share2Icon size={14} />,
                      content: <SharingPanel state={state} />,
                    },
                  ]}
                />
              ) : (
                tracksContent
              )}
            </>
          )}
          <CollectionDialogs
            slug={slug}
            state={state}
            isAlbumLike={isAlbumLike}
          />
        </div>
      </div>
    </StudioGate>
  );
}
