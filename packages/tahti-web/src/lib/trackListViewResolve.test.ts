import { describe, expect, it } from 'vitest';

import { resolveTrackListView } from './trackListViewResolve';

const base = {
  persist: true,
  storedView: null,
  pickedView: null,
  defaultDensity: 'compact' as const,
  isPhone: false,
  hasList: true,
};

describe('resolveTrackListView', () => {
  it('uses the default density on desktop when nothing was picked', () => {
    expect(resolveTrackListView(base)).toBe('compact');
  });

  it('defaults phones to the list, or dense rows when there is no list', () => {
    expect(resolveTrackListView({ ...base, isPhone: true })).toBe('list');
    expect(
      resolveTrackListView({ ...base, isPhone: true, hasList: false }),
    ).toBe('dense');
  });

  it('keeps a stored pick on phones', () => {
    expect(
      resolveTrackListView({ ...base, isPhone: true, storedView: 'grid' }),
    ).toBe('grid');
  });

  it('keeps a controlled view and a list’s own starting view', () => {
    expect(
      resolveTrackListView({
        ...base,
        isPhone: true,
        controlledView: 'comfortable',
      }),
    ).toBe('comfortable');
    expect(
      resolveTrackListView({
        ...base,
        persist: false,
        isPhone: true,
        initialView: 'grid',
      }),
    ).toBe('grid');
  });

  it('prefers what was picked on this list over its starting view', () => {
    expect(
      resolveTrackListView({
        ...base,
        persist: false,
        initialView: 'grid',
        pickedView: 'dense',
      }),
    ).toBe('dense');
  });
});
