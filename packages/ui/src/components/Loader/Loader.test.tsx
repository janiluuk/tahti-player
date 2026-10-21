import { render, screen } from '@testing-library/react';

import { Loader } from '.';

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
});
