import { cn } from '../../../utils';

/** Columns folded away in a narrow table (phones, side panels). The artist
 * then shows under the title instead, see TitleCell. */
const COLLAPSIBLE_COLUMN_IDS = new Set(['artist', 'album']);

/** Folded away a step earlier: in a table only a little wider than a phone
 * their headers ("Duration", "Released") no longer fit. */
const SECONDARY_COLUMN_IDS = new Set(['duration', 'releaseDate']);

export const collapsibleColumnClass = (columnId: string) =>
  cn(
    COLLAPSIBLE_COLUMN_IDS.has(columnId) && '@max-md:hidden',
    SECONDARY_COLUMN_IDS.has(columnId) && '@max-xl:hidden',
  );

export const narrowOnlyClass = '@md:hidden';

export const narrowHiddenClass = '@max-md:hidden';
