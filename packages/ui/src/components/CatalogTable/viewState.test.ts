import { describe, expect, it } from 'vitest';

import {
  defaultCatalogView,
  moveColumn,
  nextSort,
  normalizeCatalogView,
  resolveCatalogColumns,
  setColumnVisible,
  setColumnWidth,
  type CatalogColumn,
} from './viewState';

const column = (
  id: string,
  extra: Partial<CatalogColumn<unknown>> = {},
): CatalogColumn<unknown> => ({
  id,
  header: id,
  width: 100,
  render: () => null,
  ...extra,
});
const columns = [
  column('title', { required: true }),
  column('artist'),
  column('year', { hiddenByDefault: true }),
];

describe('catalog table view state', () => {
  it('starts with defaults: all columns in order, default-hidden ones hidden', () => {
    expect(defaultCatalogView(columns)).toEqual({
      order: ['title', 'artist', 'year'],
      hidden: ['year'],
      widths: {},
    });
  });

  it('resolves visible columns in the chosen order with custom widths', () => {
    const view = setColumnWidth(
      moveColumn(
        setColumnVisible(defaultCatalogView(columns), 'year', true),
        'year',
        -1,
      ),
      'artist',
      222,
    );
    const resolved = resolveCatalogColumns(columns, view);
    expect(resolved.map((c) => [c.id, c.pxWidth])).toEqual([
      ['title', 100],
      ['year', 100],
      ['artist', 222],
    ]);
  });

  it('never hides a required column, even from a stored view', () => {
    const view = normalizeCatalogView(columns, {
      order: ['title'],
      hidden: ['title'],
    });
    expect(view.hidden).not.toContain('title');
    expect(
      resolveCatalogColumns(columns, { ...view, hidden: ['title'] }).map(
        (c) => c.id,
      ),
    ).toContain('title');
  });

  it('drops unknown columns, appends new ones and respects their default visibility', () => {
    const view = normalizeCatalogView(columns, {
      order: ['ghost', 'artist', 'title', 'artist'],
      hidden: ['ghost'],
      widths: { ghost: 300, artist: 5, title: 9999, year: Number.NaN },
    });
    expect(view.order).toEqual(['artist', 'title', 'year']);
    expect(view.hidden).toEqual(['year']);
    expect(view.widths).toEqual({ artist: 60, title: 800 });
  });

  it('falls back to defaults for a missing stored view', () => {
    expect(normalizeCatalogView(columns, null)).toEqual(
      defaultCatalogView(columns),
    );
  });

  it('moves columns within bounds only', () => {
    const view = defaultCatalogView(columns);
    expect(moveColumn(view, 'title', -1)).toBe(view);
    expect(moveColumn(view, 'year', 1)).toBe(view);
    expect(moveColumn(view, 'artist', -1).order).toEqual([
      'artist',
      'title',
      'year',
    ]);
  });

  it('cycles sort ascending, descending, off', () => {
    const asc = nextSort(null, 'artist');
    expect(asc).toEqual({ columnId: 'artist', descending: false });
    const desc = nextSort(asc, 'artist');
    expect(desc).toEqual({ columnId: 'artist', descending: true });
    expect(nextSort(desc, 'artist')).toBeNull();
    expect(nextSort(desc, 'year')).toEqual({
      columnId: 'year',
      descending: false,
    });
  });
});
