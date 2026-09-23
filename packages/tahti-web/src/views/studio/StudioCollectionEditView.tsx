import { Link } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { Tooltip } from '@tahti-player/ui';

import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { LibrarySectionTabs } from '../LibraryView';
import { CollectionDialogs } from './collection-edit/CollectionDialogs';
import { CollectionHeader } from './collection-edit/CollectionHeader';
import { DetailsPanel } from './collection-edit/DetailsPanel';
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
  const { col, isAlbumLike } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6 px-1 py-2">
        {nav === 'library' ? (
          <LibrarySectionTabs active="collections" />
        ) : (
          <StudioNav current="/studio/collections" />
        )}
        <Tooltip content="Back to Collections" side="right">
          <Link
            to={
              nav === 'library' ? '/library/collections' : '/studio/collections'
            }
            aria-label="Back to Collections"
            className="text-foreground-secondary hover:bg-background-secondary -mt-2 inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>
        {!col ? (
          <StudioPanel>
            <PageLoading label="Loading…" />
          </StudioPanel>
        ) : (
          <>
            <CollectionHeader col={col} state={state} />
            <DetailsPanel state={state} />
            <TracklistPanel state={state} isAlbumLike={isAlbumLike} />
          </>
        )}
        <CollectionDialogs
          slug={slug}
          state={state}
          isAlbumLike={isAlbumLike}
        />
      </div>
    </StudioGate>
  );
}
