import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectableTile, SelectableTiles } from './SelectableTiles';

const mockItems: SelectableTile[] = [
  { id: 'solo', label: 'Solo artist' },
  {
    id: 'collective',
    label: 'Band / collective',
    description: 'Invite members later.',
  },
];

describe('SelectableTiles', () => {
  it('(Snapshot) renders single-select mode', () => {
    const { container } = render(
      <SelectableTiles items={mockItems} selected="solo" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('(Snapshot) renders multi-select mode', () => {
    const { container } = render(
      <SelectableTiles
        multiple
        items={mockItems}
        selected={['solo']}
        onChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('(Snapshot) renders centered layout with an icon', () => {
    const { container } = render(
      <SelectableTiles
        items={[{ id: 'a', label: 'A', icon: <svg data-testid="icon" /> }]}
        selected="a"
        onChange={vi.fn()}
        layout="centered"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('single select: calls onChange with clicked id', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(
      <SelectableTiles
        items={mockItems}
        selected="solo"
        onChange={handleChange}
      />,
    );

    await user.click(getByRole('radio', { name: /Band \/ collective/ }));
    expect(handleChange).toHaveBeenCalledWith('collective');
  });

  it('disabled: does not call onChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(
      <SelectableTiles
        items={mockItems}
        selected="solo"
        onChange={handleChange}
        disabled
      />,
    );

    await user.click(getByRole('radio', { name: /Band \/ collective/ }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('multi select: toggles selection on click', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(
      <SelectableTiles
        multiple
        items={mockItems}
        selected={['solo']}
        onChange={handleChange}
      />,
    );

    await user.click(getByRole('checkbox', { name: /Band \/ collective/ }));
    expect(handleChange).toHaveBeenCalledWith(['solo', 'collective']);
  });

  it('renders a description when provided', () => {
    const { getByText } = render(
      <SelectableTiles items={mockItems} selected="solo" onChange={vi.fn()} />,
    );
    expect(getByText('Invite members later.')).toBeInTheDocument();
  });
});
