// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as catalog from '../api/catalog-search';
import { CatalogTrackSearch } from './CatalogTrackSearch';

const ferry: catalog.CatalogTrack = {
  id: 's1',
  title: 'Midnight Ferry',
  durationSec: 245,
  artistName: 'Aino',
  channelSlug: 'aino',
};
const frost: catalog.CatalogTrack = {
  id: 's2',
  title: 'Frost Lines',
  durationSec: 312,
  artistName: 'Veikko',
  channelSlug: 'veikko',
};

describe('CatalogTrackSearch', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('searches once the query has two characters and adds a result', async () => {
    const search = vi
      .spyOn(catalog, 'searchCatalogTracks')
      .mockResolvedValue({ ok: true, tracks: [ferry, frost], hasMore: false });
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<CatalogTrackSearch excludeIds={['s2']} onAdd={onAdd} />);
    const input = screen.getByLabelText('Search the catalog');
    fireEvent.change(input, { target: { value: 'f' } });
    fireEvent.change(input, { target: { value: 'fe' } });
    const add = await screen.findByRole('button', {
      name: 'Add Midnight Ferry by Aino',
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('fe');
    expect(screen.queryByText('Frost Lines')).toBeNull();
    fireEvent.click(add);
    await vi.waitFor(() => expect(onAdd).toHaveBeenCalledWith(ferry));
  });

  it('loads the next page of results', async () => {
    const search = vi
      .spyOn(catalog, 'searchCatalogTracks')
      .mockResolvedValueOnce({ ok: true, tracks: [ferry], hasMore: true })
      .mockResolvedValueOnce({ ok: true, tracks: [frost], hasMore: false });
    render(<CatalogTrackSearch onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search the catalog'), {
      target: { value: 'lines' },
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'More results' }),
    );
    await screen.findByText('Frost Lines');
    expect(search).toHaveBeenLastCalledWith('lines', 20);
    expect(screen.queryByRole('button', { name: 'More results' })).toBeNull();
  });

  it('says when nothing matches', async () => {
    vi.spyOn(catalog, 'searchCatalogTracks').mockResolvedValue({
      ok: true,
      tracks: [],
      hasMore: false,
    });
    render(<CatalogTrackSearch onAdd={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search the catalog'), {
      target: { value: 'zzz' },
    });
    expect(
      await screen.findByText('No public tracks match “zzz”.'),
    ).toBeTruthy();
  });
});
