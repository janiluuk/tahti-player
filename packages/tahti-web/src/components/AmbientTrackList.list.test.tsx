import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { pickTrackView, resetTrackListView } from '../test/trackViewPicker';
import { AmbientTrackList } from './AmbientTrackList';

const items = [
  {
    id: 's1',
    trackId: 'sound:s1',
    title: 'Night Drive',
    artist: 'You',
    peaks: [0.2, 0.4],
    progress: 0,
    isPlaying: false,
  },
];

describe('AmbientTrackList list view', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTrackListView();
  });

  it('offers List only when a list renderer is given, and remembers it', () => {
    const { unmount } = render(
      <AmbientTrackList items={items} renderList={() => <p>raw table</p>} />,
    );

    pickTrackView('List');
    expect(screen.getByText('raw table')).toBeVisible();
    unmount();

    render(
      <AmbientTrackList items={items} renderList={() => <p>raw table</p>} />,
    );
    expect(screen.getByText('raw table')).toBeVisible();
  });

  it('has no List option without a renderer', () => {
    render(<AmbientTrackList items={items} />);

    fireEvent.click(screen.getByRole('button', { name: /^Track size/ }));
    expect(screen.queryByRole('menuitemradio', { name: 'List' })).toBeNull();
  });
});
