import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetTrackListView } from '../test/trackViewPicker';
import { AmbientTrackList } from './AmbientTrackList';

const phone = vi.hoisted(() => ({ value: false }));
vi.mock('../hooks/usePhoneViewport', () => ({
  usePhoneViewport: () => phone.value,
}));

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

describe('AmbientTrackList surface', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTrackListView();
  });

  afterEach(() => {
    phone.value = false;
  });

  it('paints the panel with the given surface in place of the default tint', () => {
    render(
      <AmbientTrackList
        items={items}
        surfaceClassName="bg-background-secondary"
        flushOnPhone
      />,
    );

    const list = screen.getByTestId('ambient-track-list');
    expect(list).toHaveClass('bg-background-secondary', 'border');
    expect(list).not.toHaveClass('bg-background-secondary/40');
    expect(list).not.toHaveAttribute('data-flush');
  });

  it('drops the panel and its surface class on phones', () => {
    phone.value = true;
    render(
      <AmbientTrackList
        items={items}
        surfaceClassName="bg-background-secondary"
        flushOnPhone
      />,
    );

    const list = screen.getByTestId('ambient-track-list');
    expect(list).toHaveAttribute('data-flush');
    expect(list).not.toHaveClass('bg-background-secondary');
    expect(list).not.toHaveClass('border');
  });

  it('drops the panel on phones by default', () => {
    phone.value = true;
    render(<AmbientTrackList items={items} />);

    const list = screen.getByTestId('ambient-track-list');
    expect(list).toHaveAttribute('data-flush');
    expect(list).not.toHaveClass('border');
  });

  it('keeps the panel on phones when flushOnPhone is off', () => {
    phone.value = true;
    render(
      <AmbientTrackList
        items={items}
        surfaceClassName="bg-background-secondary"
        flushOnPhone={false}
      />,
    );

    expect(screen.getByTestId('ambient-track-list')).toHaveClass(
      'bg-background-secondary',
      'border',
    );
  });
});
