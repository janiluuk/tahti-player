import { useState } from 'react';
import { toast } from 'sonner';

import type { TahtiPlayable } from '../../api/types';
import type {
  NativeFacetFilter,
  NativeFacetGroup,
  NativeTrackFilters,
  NativeTrackSort,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { preparePlayables } from '../../lib/nativePlayback';
import { usePlayerStore } from '../../stores/playerStore';
import { runAnalysis } from '../LocalLibraryAnalysis';
import { facetTitle, type BrowseKind } from '../LocalLibraryBrowse';

type SelectionScope = {
  library: TahtiNativeLibrary | null;
  /** The current search, group, sort and filters: what "shown order" means. */
  query: string;
  facetFilter: NativeFacetFilter | null;
  sort: NativeTrackSort | null;
  filters: NativeTrackFilters;
  total: number;
  browseKind: BrowseKind;
  refresh: () => Promise<void>;
};

/** What is selected in the track table, and the play / queue / playlist / analyze actions on it. */
export function useSelectionActions({
  library,
  query,
  facetFilter,
  sort,
  filters,
  total,
  browseKind,
  refresh,
}: SelectionScope) {
  const play = usePlayerStore((s) => s.play);
  const enqueueMany = usePlayerStore((s) => s.enqueueMany);
  const playNextMany = usePlayerStore((s) => s.playNextMany);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [analyzingSelection, setAnalyzingSelection] = useState(false);
  const [addToPlaylist, setAddToPlaylist] = useState<{
    summary: string;
    resolve: () => Promise<string[]>;
  } | null>(null);

  const analyzeSelection = async () => {
    if (!library || analyzingSelection) {
      return;
    }
    setAnalyzingSelection(true);
    try {
      await runAnalysis(library, [...selectedIds]);
    } finally {
      setAnalyzingSelection(false);
      void refresh();
    }
  };

  const selectAllMatching = async () => {
    if (!library) {
      return;
    }
    setSelectingAll(true);
    try {
      setSelectedIds(
        new Set(await library.matchingIds(query, facetFilter, sort, filters)),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not select all tracks.',
      );
    } finally {
      setSelectingAll(false);
    }
  };

  /**
   * Turns tracks into playables, in the order the table currently shows them
   * (not the order they were clicked), so what plays or queues is
   * predictable. `pick` narrows the shown order (to the selection, or not at
   * all for "play all"). Capped so a whole-library action can't flood the queue.
   */
  const playablesFor = async (
    pick: (shownIds: string[]) => string[],
    noun: string,
  ) => {
    if (!library) {
      return null;
    }
    const shown = await library.matchingIds(query, facetFilter, sort, filters);
    return preparePlayables(library, pick(shown), noun);
  };

  const runSelectionAction = async (
    action: (playables: TahtiPlayable[]) => void,
    scope: 'selected' | 'all' = 'selected',
  ) => {
    setSelectionBusy(true);
    try {
      const playables =
        scope === 'all'
          ? await playablesFor((shown) => shown, 'matching')
          : await playablesFor(
              (shown) => shown.filter((id) => selectedIds.has(id)),
              'selected',
            );
      if (playables?.length) {
        action(playables);
      } else if (playables) {
        toast.error('None of these tracks can be played.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not use the selection.',
      );
    } finally {
      setSelectionBusy(false);
    }
  };

  const playSelection = () =>
    runSelectionAction((playables) => {
      const [head, ...rest] = playables;
      if (head) {
        play(head, { enqueueRest: rest });
      }
    });
  const playAllMatching = () =>
    runSelectionAction((playables) => {
      const [head, ...rest] = playables;
      if (head) {
        play(head, { enqueueRest: rest });
      }
    }, 'all');
  const playNextSelection = () =>
    runSelectionAction((playables) => {
      playNextMany(playables);
      toast.success(
        playables.length === 1
          ? 'Playing 1 track next.'
          : `Playing ${playables.length.toLocaleString('en-US')} tracks next.`,
      );
    });
  const queueSelection = () =>
    runSelectionAction((playables) => {
      enqueueMany(playables);
    });

  const idsInShownOrder = (pick: (shown: string[]) => string[]) => async () => {
    if (!library) {
      return [];
    }
    return pick(await library.matchingIds(query, facetFilter, sort, filters));
  };
  const addSelectionToPlaylist = () =>
    setAddToPlaylist({
      summary:
        selectedIds.size === 1
          ? '1 selected track'
          : `${selectedIds.size.toLocaleString('en-US')} selected tracks`,
      resolve: idsInShownOrder((shown) =>
        shown.filter((id) => selectedIds.has(id)),
      ),
    });
  const addAllToPlaylist = () =>
    setAddToPlaylist({
      summary: `All ${total.toLocaleString('en-US')} tracks matching the current view`,
      resolve: idsInShownOrder((shown) => shown),
    });
  const addGroupToPlaylist = (group: NativeFacetGroup) => {
    if (!library || browseKind === 'tracks' || browseKind === 'playlists') {
      return;
    }
    const kind = browseKind;
    setAddToPlaylist({
      summary: `${group.trackCount.toLocaleString('en-US')} tracks from “${facetTitle(kind, group)}”`,
      resolve: () =>
        library.matchingIds(
          '',
          {
            kind,
            value: group.name,
            secondary: kind === 'albums' ? group.secondary : null,
          },
          // Album order (disc, then track) for anything that is an album or a
          // folder of albums; title order for genres.
          kind === 'genres' ? null : { column: 'album', descending: false },
          null,
        ),
    });
  };

  return {
    selectedIds,
    setSelectedIds,
    selectingAll,
    selectionBusy,
    analyzingSelection,
    addToPlaylist,
    setAddToPlaylist,
    analyzeSelection,
    selectAllMatching,
    playSelection,
    playAllMatching,
    playNextSelection,
    queueSelection,
    addSelectionToPlaylist,
    addAllToPlaylist,
    addGroupToPlaylist,
  };
}
