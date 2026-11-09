// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  afterEach(cleanup);

  it('renders a hidden block on the control surface that stops pulsing under reduced motion', () => {
    render(<Skeleton className="h-24 w-40" />);
    const block = screen.getByTestId('skeleton');
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveAttribute('data-shape', 'block');
    expect(block).toHaveClass(
      'bg-background-input',
      'animate-pulse',
      'motion-reduce:animate-none',
      'h-24',
      'w-40',
    );
  });

  it('stacks lines with a shorter last line', () => {
    render(<Skeleton shape="line" lines={3} />);
    const group = screen.getByTestId('skeleton');
    expect(group).toHaveAttribute('data-shape', 'line');
    const bars = Array.from(group.children);
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveClass('w-full', 'bg-background-input');
    expect(bars[2]).toHaveClass('w-3/5');
  });

  it('renders a single line bar', () => {
    render(<Skeleton shape="line" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('h-3', 'rounded-full');
  });
});
