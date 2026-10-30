import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useTrackListViewStore } from '../stores/trackListViewStore';
import { pickTrackView, resetTrackListView } from '../test/trackViewPicker';
import { AmbientTrackList } from './AmbientTrackList';

const onPlay = vi.fn();
const items = [
  {
    id: 's1',
    trackId: 'sound:s1',
    title: 'Night Drive',
    artist: 'Aurora Keys',
    peaks: null,
    progress: 0,
    isPlaying: false,
    onPlay,
  },
];

describe('AmbientTrackList grid view', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTrackListView();
    onPlay.mockClear();
  });

  it('renders cover cards that play, and remembers the choice', () => {
    const { unmount } = render(<AmbientTrackList items={items} allowGrid />);

    pickTrackView('Grid');
    expect(screen.getByTestId('ambient-track-grid')).toBeVisible();
    expect(screen.getByTestId('ambient-track-list')).toHaveAttribute(
      'data-density',
      'grid',
    );
    expect(screen.getByText('Aurora Keys')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Play Night Drive' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    unmount();

    render(<AmbientTrackList items={items} allowGrid />);
    expect(screen.getByTestId('ambient-track-grid')).toBeVisible();
    expect(localStorage.getItem('tahti.ambientTrackList.density')).toBe('grid');
  });

  it('ignores a stored grid choice where grid is not offered', () => {
    useTrackListViewStore.setState({ view: 'grid' });
    render(<AmbientTrackList items={items} />);

    fireEvent.click(screen.getByRole('button', { name: /^Track size/ }));
    expect(screen.queryByRole('menuitemradio', { name: 'Grid' })).toBeNull();
    expect(screen.queryByTestId('ambient-track-grid')).toBeNull();
  });

  it('shows the empty message in grid view', () => {
    useTrackListViewStore.setState({ view: 'grid' });
    render(
      <AmbientTrackList items={[]} allowGrid emptyMessage="Nothing saved." />,
    );

    expect(screen.getByText('Nothing saved.')).toBeVisible();
  });
});
