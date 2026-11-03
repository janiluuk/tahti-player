import { fireEvent, render, screen } from '@testing-library/react';

import { SortMenuButton } from './SortMenuButton';

const options = [
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name A–Z' },
] as const;

describe('SortMenuButton', () => {
  it('names the current order, checks it, and reports a new choice', async () => {
    const onChange = vi.fn();
    render(
      <SortMenuButton
        options={options}
        value="name"
        onChange={onChange}
        label="Sort files"
        defaultValue="newest"
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Sort files (Name A–Z)' }),
    );
    expect(
      await screen.findByRole('menuitemradio', { name: 'Name A–Z' }),
    ).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Newest' }));
    expect(onChange).toHaveBeenCalledWith('newest');
  });
});
