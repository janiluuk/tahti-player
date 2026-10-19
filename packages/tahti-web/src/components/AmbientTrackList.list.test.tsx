import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

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
  });

  it('offers List only when a list renderer is given, and remembers it', () => {
    const { unmount } = render(
      <AmbientTrackList items={items} renderList={() => <p>raw table</p>} />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByText('raw table')).toBeVisible();
    unmount();

    render(
      <AmbientTrackList items={items} renderList={() => <p>raw table</p>} />,
    );
    expect(screen.getByText('raw table')).toBeVisible();
  });

  it('has no List option without a renderer', () => {
    render(<AmbientTrackList items={items} />);

    expect(screen.queryByRole('radio', { name: 'List' })).toBeNull();
  });
});
