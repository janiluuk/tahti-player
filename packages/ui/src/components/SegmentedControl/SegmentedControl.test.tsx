import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SegmentedControl } from './SegmentedControl';

const options = [
  { id: 'cards', label: 'Card view', icon: <span>C</span> },
  { id: 'list', label: 'List view', icon: <span>L</span> },
] as const;

describe('SegmentedControl', () => {
  it('marks the current option and reports a new choice', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="Schedule view"
        options={options}
        value="cards"
        onChange={onChange}
        iconOnly
      />,
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Schedule view' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Card view' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'List view' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await userEvent.click(screen.getByRole('radio', { name: 'List view' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('shows labels as text when not icon-only', () => {
    render(
      <SegmentedControl
        aria-label="View"
        options={options}
        value="list"
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('radio', { name: /List view/ })).toHaveTextContent(
      'List view',
    );
  });
});
