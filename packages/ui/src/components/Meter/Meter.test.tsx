import { render, screen } from '@testing-library/react';

import { Meter } from './Meter';

describe('Meter', () => {
  it('(Snapshot) renders at 40%', () => {
    const { container } = render(<Meter value={40} />);
    expect(container).toMatchSnapshot();
  });

  it('sets aria-valuenow/min/max', () => {
    render(<Meter value={30} max={50} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '30');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '50');
  });

  it('clamps width to 100% when value exceeds max', () => {
    render(<Meter value={150} max={100} />);
    const bar = screen.getByRole('meter').firstElementChild as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  it('clamps width to 0% when value is negative', () => {
    render(<Meter value={-10} max={100} />);
    const bar = screen.getByRole('meter').firstElementChild as HTMLElement;
    expect(bar.style.width).toBe('0%');
  });

  it('merges custom className', () => {
    render(<Meter value={10} className="custom-class" />);
    expect(screen.getByRole('meter')).toHaveClass('custom-class');
  });
});
