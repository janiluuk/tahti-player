import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../../../api/studio-types';
import { AddTracksDialog } from './AddTracksDialog';

const sound = (over: Partial<StudioSound>): StudioSound =>
  ({
    id: 's1',
    title: 'Ready track',
    status: 'READY',
    durationSec: 125,
    ...over,
  }) as StudioSound;

function renderDialog(sounds: StudioSound[]) {
  render(
    <AddTracksDialog
      isOpen
      onClose={vi.fn()}
      title="Add content to album"
      sounds={sounds}
      existingSoundIds={new Set()}
      addBusyId={null}
      isPreviewing={() => false}
      onPreview={vi.fn()}
      onPause={vi.fn()}
      onAdd={vi.fn()}
    />,
  );
}

describe('AddTracksDialog', () => {
  it('disables tracks that are still processing', () => {
    renderDialog([
      sound({}),
      sound({ id: 's2', title: 'Fresh upload', status: 'PENDING' }),
    ]);

    expect(
      screen.getByRole('button', {
        name: 'Add Fresh upload (available once processing finishes)',
      }),
    ).toBeDisabled();
    expect(screen.getByText('Processing…')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add' })[0]).toBeEnabled();
  });

  it('leaves out the artist instead of saying "Unknown artist"', () => {
    renderDialog([sound({ artistName: null, genre: 'Techno' })]);

    expect(screen.queryByText(/Unknown artist/)).not.toBeInTheDocument();
    expect(screen.getByText('Techno · 2:05')).toBeInTheDocument();
  });
});
