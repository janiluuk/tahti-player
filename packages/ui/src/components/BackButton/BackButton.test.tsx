import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackButton, BackButtonAnchor } from './BackButton';

describe('BackButton', () => {
  it('(Snapshot) renders the round back control', () => {
    const { container } = render(<BackButton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('calls onClick and defaults the accessible name', async () => {
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Go back' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders a forward control when direction is forward', () => {
    render(<BackButton direction="forward" />);
    expect(
      screen.getByRole('button', { name: 'Go forward' }),
    ).toBeInTheDocument();
  });

  it('renders an anchor with the same chrome', () => {
    render(<BackButtonAnchor href="/radio" aria-label="Back to radio" />);
    expect(screen.getByRole('link', { name: 'Back to radio' })).toHaveAttribute(
      'href',
      '/radio',
    );
  });
});
