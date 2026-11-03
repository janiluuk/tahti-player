import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditIconButton } from './EditIconButton';

describe('EditIconButton', () => {
  it('(Snapshot) renders the pencil button', () => {
    const { container } = render(<EditIconButton label="Edit details" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('is named by its label and calls onClick', async () => {
    const onClick = vi.fn();
    render(<EditIconButton label="Edit Night Drive" onClick={onClick} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Night Drive' }),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Edit Night Drive' }),
    ).not.toHaveAttribute('aria-pressed');
  });

  it('works as an edit-mode toggle', () => {
    const { rerender } = render(
      <EditIconButton label="Edit details" editing={false} />,
    );
    expect(
      screen.getByRole('button', { name: 'Edit details' }),
    ).toHaveAttribute('aria-pressed', 'false');
    rerender(<EditIconButton label="Edit details" editing />);
    expect(
      screen.getByRole('button', { name: 'Done editing' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
