import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TrackSortButton } from './TrackSortButton';

describe('TrackSortButton', () => {
  it('names the current order and checks it in the menu', async () => {
    const onChange = vi.fn();
    render(<TrackSortButton value="title" onChange={onChange} />);
    const trigger = screen.getByRole('button', {
      name: 'Sort tracks (Title A–Z)',
    });
    fireEvent.click(trigger);
    const checked = await screen.findByRole('menuitemradio', {
      name: 'Title A–Z',
    });
    expect(checked).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(
      screen.getByRole('menuitemradio', { name: 'Longest first' }),
    );
    expect(onChange).toHaveBeenCalledWith('longest');
  });
});
