import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import {
  EllipsisVertical,
  HashIcon,
  Heart,
  ImageIcon,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';

import { pickArtwork, Track } from '@tahti-player/model';

import { cn } from '../../../utils';
import { formatTimeMillis } from '../../../utils/time';
import { ActionsCell } from '../Cells/ActionsCell';
import { FavoriteCell } from '../Cells/FavoriteCell';
import { PositionCell } from '../Cells/PositionCell';
import { RemoveCell } from '../Cells/RemoveCell';
import { SelectCell } from '../Cells/SelectCell';
import { TextCell } from '../Cells/TextCell';
import { ThumbnailCell } from '../Cells/ThumbnailCell';
import { TitleCell } from '../Cells/TitleCell';
import { IconHeader } from '../Headers/IconHeader';
import { SelectAllHeader } from '../Headers/SelectAllHeader';
import { TextHeader } from '../Headers/TextHeader';
import { TrackTableProps } from '../types';
import { formatReleaseDate } from '../utils/date';

export function useColumns<T extends Track = Track>(
  props: Pick<
    TrackTableProps<T>,
    'display' | 'labels' | 'actions' | 'features'
  >,
  actionsColumn: { show: boolean; className: string },
): ColumnDef<T>[] {
  const { display, labels, actions, features } = props;
  const columnHelper = createColumnHelper<T>();

  const showFavorite =
    display?.displayFavorite && Boolean(actions?.onToggleFavorite);
  const showDelete = display?.displayDeleteButton && Boolean(actions?.onRemove);
  const showActions = actionsColumn.show;

  const showSelect = Boolean(features?.selectable);

  const columns: ColumnDef<T>[] = useMemo(
    () => [
      showSelect &&
        columnHelper.display({
          id: 'select',
          header: SelectAllHeader,
          cell: SelectCell,
          enableSorting: false,
        }),
      display?.displayPosition &&
        columnHelper.accessor((track) => track.trackNumber, {
          id: 'position',
          enableSorting: true,
          header: (context) => (
            <IconHeader
              Icon={HashIcon}
              label={labels.headers.position ?? 'Track number'}
              context={context}
            />
          ),
          cell: PositionCell,
        }),
      display?.displayThumbnail &&
        columnHelper.accessor(
          (track) => pickArtwork(track.artwork, 'thumbnail', 40),
          {
            id: 'thumbnail',
            header: (context) => (
              <IconHeader
                Icon={ImageIcon}
                label={labels.headers.artwork ?? 'Artwork'}
                context={context}
                className="w-14"
              />
            ),
            cell: ThumbnailCell,
            enableSorting: false,
          },
        ),
      columnHelper.accessor((track) => track.artists[0].name, {
        id: 'artist',
        enableSorting: true,
        header: (context) => (
          <TextHeader context={context}>{labels.headers.artist}</TextHeader>
        ),
        cell: TextCell,
      }),
      columnHelper.accessor((track) => track.title, {
        id: 'title',
        enableSorting: true,
        header: (context) => (
          <TextHeader context={context}>{labels.headers.title}</TextHeader>
        ),
        cell: TitleCell,
      }),
      display?.displayAlbum &&
        columnHelper.accessor((track) => track.album?.title, {
          id: 'album',
          enableSorting: true,
          header: (context) => (
            <TextHeader context={context}>{labels.headers.album}</TextHeader>
          ),
          cell: TextCell,
        }),
      display?.displayDuration &&
        columnHelper.accessor((track) => formatTimeMillis(track.durationMs), {
          id: 'duration',
          enableSorting: true,
          header: (context) => (
            <TextHeader context={context}>{labels.headers.duration}</TextHeader>
          ),
          cell: TextCell,
        }),
      display?.displayReleaseDate &&
        columnHelper.accessor((track) => formatReleaseDate(track.releaseDate), {
          id: 'releaseDate',
          enableSorting: true,
          header: (context) => (
            <TextHeader context={context}>
              {labels.headers.releaseDate ?? 'Released'}
            </TextHeader>
          ),
          cell: TextCell,
        }),
      // Right-aligned trailing cluster: favorite, then the queue/edit/detail/
      // context-menu actions column, then delete last -- every per-row
      // control lines up at the row's right edge instead of favorite sitting
      // at the far left while the rest hide mid-row in the title cell.
      showFavorite &&
        columnHelper.display({
          id: 'favorite',
          header: (context) => (
            <IconHeader
              Icon={Heart}
              label={labels.headers.favorite ?? 'Favorite'}
              context={context}
            />
          ),
          cell: FavoriteCell,
        }),
      showActions &&
        columnHelper.display({
          id: 'actions',
          header: () => (
            <th
              role="columnheader"
              className={cn(actionsColumn.className, 'text-center')}
            >
              <span className="flex w-full items-center justify-center">
                <EllipsisVertical className="h-4 w-4" aria-hidden />
                <span className="sr-only">
                  {labels.headers.actions ?? 'Actions'}
                </span>
              </span>
            </th>
          ),
          cell: ActionsCell,
        }),
      showDelete &&
        columnHelper.display({
          id: 'delete',
          header: (context) => (
            <IconHeader
              Icon={Trash2}
              label={labels.headers.remove ?? 'Remove'}
              context={context}
            />
          ),
          cell: RemoveCell,
        }),
    ],
    [
      labels,
      display,
      showFavorite,
      showActions,
      showDelete,
      showSelect,
      actionsColumn.className,
    ],
  ).filter(Boolean) as ColumnDef<T>[];

  return columns;
}
