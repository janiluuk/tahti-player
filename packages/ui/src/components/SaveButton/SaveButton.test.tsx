import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SaveButton } from './SaveButton';

describe('SaveButton', () => {
  it('(Snapshot) renders default state', () => {
    const { container } = render(<SaveButton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the idle label with a save icon', () => {
    render(<SaveButton label="Save profile" />);

    const button = screen.getByRole('button', { name: 'Save profile' });
    expect(button).not.toBeDisabled();
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('shows the saving label and disables the button while saving', () => {
    render(<SaveButton label="Save profile" saving savingLabel="Saving…" />);

    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<SaveButton label="Save" onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stays disabled when disabled is set', () => {
    render(<SaveButton label="Save profile" disabled />);
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  });
});
