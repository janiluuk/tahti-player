import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    onPlay.mockClear();
  });

  it('renders cover cards that play, and remembers the choice', () => {
    const { unmount } = render(<AmbientTrackList items={items} allowGrid />);

    fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
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
  });

  it('ignores a stored grid choice where grid is not offered', () => {
    localStorage.setItem('tahti.ambientTrackList.density', 'grid');
    render(<AmbientTrackList items={items} />);

    expect(screen.queryByRole('radio', { name: 'Grid' })).toBeNull();
    expect(screen.queryByTestId('ambient-track-grid')).toBeNull();
  });

  it('shows the empty message in grid view', () => {
    localStorage.setItem('tahti.ambientTrackList.density', 'grid');
    render(
      <AmbientTrackList items={[]} allowGrid emptyMessage="Nothing saved." />,
    );

    expect(screen.getByText('Nothing saved.')).toBeVisible();
  });
});
