import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('uses the label as the accessible name by default', () => {
    render(<Toggle label="Autoplay" />);
    const toggle = screen.getByRole('switch', { name: 'Autoplay' });
    expect(toggle).toHaveAttribute('aria-label', 'Autoplay');
    expect(screen.queryByText('Autoplay')).toBeNull();
  });

  it('shows the label as clickable text with showLabel', () => {
    const onChange = vi.fn();
    render(<Toggle label="Autoplay" showLabel onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: 'Autoplay' });
    expect(toggle).not.toHaveAttribute('aria-label');
    fireEvent.click(screen.getByText('Autoplay'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
