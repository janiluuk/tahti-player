export type LibrarySort = 'name' | 'newest' | 'oldest';

export const LIBRARY_SORT_OPTIONS: { id: LibrarySort; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'name', label: 'Name A–Z' },
];

export const isLibrarySort = (value: unknown): value is LibrarySort =>
  LIBRARY_SORT_OPTIONS.some((option) => option.id === value);

const byText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

const toTime = (value: string | null | undefined): number => {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? NaN : parsed;
};

export function sortLibraryItems<T>(
  items: readonly T[],
  sort: LibrarySort,
  getName: (item: T) => string,
  getDate: (item: T) => string | null | undefined,
): T[] {
  const indexed = items.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    if (sort === 'name') {
      return byText(getName(a.item), getName(b.item)) || a.index - b.index;
    }
    const ad = toTime(getDate(a.item));
    const bd = toTime(getDate(b.item));
    if (Number.isNaN(ad) || Number.isNaN(bd)) {
      if (Number.isNaN(ad) && Number.isNaN(bd)) {
        return a.index - b.index;
      }
      return Number.isNaN(ad) ? 1 : -1;
    }
    const diff = sort === 'newest' ? bd - ad : ad - bd;
    return diff || a.index - b.index;
  });
  return indexed.map(({ item }) => item);
}
