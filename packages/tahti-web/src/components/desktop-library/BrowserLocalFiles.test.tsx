// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useLocalLibraryStore,
  type LocalLibraryTrack,
} from '../../stores/localLibraryStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { pickTrackView, resetTrackListView } from '../../test/trackViewPicker';
import { BrowserLocalFiles } from './BrowserLocalFiles';

function localTrack(id: string, title: string): LocalLibraryTrack {
  return {
    id,
    title,
    artist: 'Ada',
    fileName: `${title}.mp3`,
    objectUrl: `blob:${id}`,
    addedAt: '2026-10-27T00:00:00.000Z',
  };
}

describe('BrowserLocalFiles', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTrackListView();
    URL.revokeObjectURL = vi.fn();
    useLocalLibraryStore.setState({
      tracks: [localTrack('a', 'Borealis'), localTrack('b', 'Aurora')],
    });
  });
  afterEach(() => {
    cleanup();
    useLocalLibraryStore.setState({ tracks: [] });
  });

  it('puts search, sort and track size in one toolbar row', async () => {
    await renderWithRouter(<BrowserLocalFiles />);

    const list = screen.getByTestId('ambient-track-list');
    expect(list).toHaveTextContent('Borealis');
    expect(list).toHaveTextContent('Aurora');
    const toolbar = within(screen.getByTestId('ambient-track-list-toolbar'));
    expect(
      toolbar.getByRole('searchbox', { name: 'Search local files' }),
    ).toBeTruthy();
    expect(toolbar.getByRole('button', { name: 'Sort tracks' })).toBeTruthy();
    expect(toolbar.getByRole('button', { name: /^Track size/ })).toBeTruthy();
  });

  it('keeps the search box when nothing matches', async () => {
    await renderWithRouter(<BrowserLocalFiles />);

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search local files' }),
      { target: { value: 'zzz' } },
    );
    expect(screen.getByText('No playable files match “zzz”.')).toBeTruthy();
    expect(
      screen.getByRole('searchbox', { name: 'Search local files' }),
    ).toHaveValue('zzz');
  });

  it('removes a file from its ambient row', async () => {
    await renderWithRouter(<BrowserLocalFiles />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Borealis' }));

    expect(
      useLocalLibraryStore.getState().tracks.map((track) => track.title),
    ).toEqual(['Aurora']);
    expect(screen.getByTestId('ambient-track-list')).not.toHaveTextContent(
      'Borealis',
    );
  });

  it('keeps multi-select and bulk remove in the List view', async () => {
    await renderWithRouter(<BrowserLocalFiles />);

    pickTrackView('List');
    const list = screen.getByTestId('ambient-track-list');
    expect(within(list).getAllByRole('checkbox').length).toBeGreaterThan(1);
  });
});
