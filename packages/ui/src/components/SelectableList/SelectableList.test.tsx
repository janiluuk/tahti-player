import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectableList, SelectableListItem } from './SelectableList';

const mockItems: SelectableListItem[] = [
  { id: 'ada', title: 'Ada Lovelace', subtitle: '@ada', meta: 'ADMIN' },
  { id: 'grace', title: 'Grace Hopper', subtitle: '@grace' },
];

describe('SelectableList', () => {
  it('(Snapshot) renders a list of rows', () => {
    const { container } = render(
      <SelectableList items={mockItems} selected="ada" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('calls onChange with the clicked row id', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(
      <SelectableList
        items={mockItems}
        selected="ada"
        onChange={handleChange}
      />,
    );

    await user.click(getByRole('radio', { name: /Grace Hopper/ }));
    expect(handleChange).toHaveBeenCalledWith('grace');
  });

  it('marks the selected row as checked', () => {
    const { getByRole } = render(
      <SelectableList items={mockItems} selected="grace" onChange={vi.fn()} />,
    );
    expect(getByRole('radio', { name: /Grace Hopper/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(getByRole('radio', { name: /Ada Lovelace/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('disabled: does not call onChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { getByRole } = render(
      <SelectableList
        items={mockItems}
        selected="ada"
        onChange={handleChange}
        disabled
      />,
    );

    await user.click(getByRole('radio', { name: /Grace Hopper/ }));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders subtitle and meta when provided', () => {
    const { getByText } = render(
      <SelectableList items={mockItems} selected="ada" onChange={vi.fn()} />,
    );
    expect(getByText('@ada')).toBeInTheDocument();
    expect(getByText('ADMIN')).toBeInTheDocument();
  });
});
