import { render, screen } from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  it('adds no colours or hover fill for the plain variant', () => {
    render(
      <Button variant="plain" size="flexible" className="bg-primary">
        Selected
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Selected' });
    expect(button).toHaveClass('bg-primary');
    expect(button.className).not.toMatch(/hover:bg-|active:bg-|shadow/);
  });

  it('defaults to type button', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'type',
      'button',
    );
  });
});
