import { render, screen } from '@testing-library/react';

import { InlineLoader, Loader } from '.';

describe('Loader', () => {
  it('is decorative without a label', () => {
    render(<Loader size="inline" shape="circle" />);
    const loader = screen.getByTestId('loader');
    expect(loader).toHaveAttribute('aria-hidden', 'true');
    expect(loader).toHaveAttribute('width', '14');
  });

  it('announces its label as a status', () => {
    render(<Loader label="Loading tracks" className="mr-1.5" />);
    const loader = screen.getByRole('status', { name: 'Loading tracks' });
    expect(loader).toHaveClass('animate-spin', 'mr-1.5');
    expect(loader).toHaveAttribute('width', '24');
  });

  it('accepts a pixel size', () => {
    render(<Loader size={28} shape="circle" />);
    expect(screen.getByTestId('loader')).toHaveAttribute('width', '28');
  });

  it('shows inline loading text as a status', () => {
    render(<InlineLoader label="Loading the board…" textSize="xs" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading the board…');
    expect(status).toHaveClass('text-xs');
    expect(screen.getByTestId('loader')).toHaveAttribute('width', '12');
  });
});
