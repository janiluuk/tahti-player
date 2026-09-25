import { cn } from '../../../utils';

/** Columns folded away in a narrow table (phones, side panels). The artist
 * then shows under the title instead, see TitleCell. */
const COLLAPSIBLE_COLUMN_IDS = new Set([
  'artist',
  'album',
  'duration',
  'releaseDate',
]);

export const collapsibleColumnClass = (columnId: string) =>
  cn(COLLAPSIBLE_COLUMN_IDS.has(columnId) && '@max-md:hidden');

export const narrowOnlyClass = '@md:hidden';
