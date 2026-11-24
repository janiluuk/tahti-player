import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../test/renderWithRouter';
import { RadioUpNextPanel } from './RadioUpNextPanel';

describe('RadioUpNextPanel', () => {
  it('keeps the current rotation track highlighted before the upcoming tracks', async () => {
    const onPlay = vi.fn();
    await renderWithRouter(
      <RadioUpNextPanel
        onRotation
        current={{
          id: 'current',
          title: 'Current song',
          artistName: 'Artist',
          artworkUrl: null,
          current: true,
          playing: true,
          onPlay,
        }}
        rotation={[
          {
            id: 'next',
            title: 'Next song',
            artistName: 'Artist',
            artistUsername: null,
            artworkUrl: null,
          },
        ]}
        onRetryRotation={vi.fn()}
      />,
    );
    const rows = screen.getAllByTestId('track-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute('aria-current', 'true');
    expect(rows[1]).not.toHaveAttribute('aria-current');
    await userEvent.click(
      within(rows[0]!).getByRole('button', { name: 'Pause Current song' }),
    );
    expect(onPlay).toHaveBeenCalledOnce();
    expect(
      within(rows[1]!).getByRole('button', { name: 'Play Next song' }),
    ).toBeDisabled();
  });
});
