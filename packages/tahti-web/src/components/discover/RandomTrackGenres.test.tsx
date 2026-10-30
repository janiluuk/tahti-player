import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RandomTrackGenres } from './RandomTrackGenres';

function Harness({ initial }: { initial: string[] }) {
  const [genres, setGenres] = useState(initial);
  return (
    <RandomTrackGenres
      genres={genres}
      onChange={setGenres}
      onShuffle={vi.fn()}
    />
  );
}

function pills() {
  return within(
    screen.getByRole('list', { name: 'Random track genres', hidden: true }),
  )
    .getAllByRole('listitem', { hidden: true })
    .map((item) => item.textContent);
}

describe('RandomTrackGenres', () => {
  it('shows All genres until specific genres are picked', () => {
    render(<Harness initial={[]} />);
    expect(pills()).toEqual(['All genres']);

    fireEvent.click(screen.getByRole('button', { name: 'Choose genres' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'House' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Techno' }));
    expect(pills()).toEqual(['House', 'Techno']);
  });

  it('clears the specific genres when All genres is picked', () => {
    render(<Harness initial={['House', 'Techno']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose genres' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'All genres' }));
    expect(pills()).toEqual(['All genres']);
  });
});
