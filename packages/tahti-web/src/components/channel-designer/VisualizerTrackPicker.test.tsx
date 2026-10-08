import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StudioSound } from '../../api/studio-types';
import { VisualizerTrackPicker } from './VisualizerTrackPicker';

const track: StudioSound = {
  id: 'arch-1',
  title: 'Aurora Set',
  status: 'READY',
  artistName: 'Northern',
  durationSec: 125,
};

describe('VisualizerTrackPicker', () => {
  it('shows empty state', () => {
    render(
      <VisualizerTrackPicker
        tracks={[]}
        selectedId={null}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByText('No playable tracks')).toBeInTheDocument();
  });

  it('selects a track', () => {
    const onSelect = vi.fn();
    render(
      <VisualizerTrackPicker
        tracks={[track]}
        selectedId={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Aurora Set/i }));
    expect(onSelect).toHaveBeenCalledWith(track);
  });
});
