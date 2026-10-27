import {
  backButtonCornerClassName,
  BackButtonLink,
  Tooltip,
} from '@tahti-player/ui';

import { PageError, PageLoading } from '../../components/PageStates';
import { RestrictionNotice } from '../../components/RestrictionNotice';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { LibrarySectionTabs } from '../LibraryView';
import { CollectionDialogs } from './collection-edit/CollectionDialogs';
import { CollectionHeader } from './collection-edit/CollectionHeader';
import { DetailsPanel } from './collection-edit/DetailsPanel';
import { MikseriImportPanel } from './collection-edit/MikseriImportPanel';
import { MixcloudImportPanel } from './collection-edit/MixcloudImportPanel';
import { SpotifyImportPanel } from './collection-edit/SpotifyImportPanel';
import { TextLayerPanel } from './collection-edit/TextLayerPanel';
import { TracklistPanel } from './collection-edit/TracklistPanel';
import { useCollectionEditState } from './collection-edit/useCollectionEditState';

export function StudioCollectionEditView({
  slug,
  nav = 'studio',
}: {
  slug: string;
  /** Which top navigation this page was reached through. */
  nav?: 'studio' | 'library';
}) {
  const state = useCollectionEditState(slug);
  const { col, isAlbumLike, loadError, reload } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        {nav === 'library' ? <LibrarySectionTabs active="collections" /> : null}
        <div className="relative flex flex-col gap-6">
          <Tooltip
            content="Back to Collections"
            side="right"
            wrapperClassName={backButtonCornerClassName}
          >
            <BackButtonLink
              to={
                nav === 'library'
                  ? '/library/collections'
                  : '/studio/collections'
              }
              aria-label="Back to Collections"
            />
          </Tooltip>
          {!col && loadError ? (
            <StudioPanel>
              <PageError
                title="Could not load this collection"
                description={loadError}
                onRetry={reload}
              />
            </StudioPanel>
          ) : !col ? (
            <StudioPanel>
              <PageLoading label="Loading…" />
            </StudioPanel>
          ) : (
            <>
              <CollectionHeader col={col} state={state} />
              <DetailsPanel state={state} />
              <TextLayerPanel slug={slug} />
              <TracklistPanel state={state} isAlbumLike={isAlbumLike} />
              {col.id ? <RestrictionNotice type="UPLOAD" /> : null}
              {col.id ? (
                <MixcloudImportPanel
                  collectionId={col.id}
                  onAdded={() => void state.refreshItems()}
                />
              ) : null}
              {col.id ? (
                <MikseriImportPanel
                  collectionId={col.id}
                  onAdded={() => void state.refreshItems()}
                />
              ) : null}
              {col.id ? (
                <SpotifyImportPanel
                  collectionId={col.id}
                  onAdded={() => void state.refreshItems()}
                />
              ) : null}
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
