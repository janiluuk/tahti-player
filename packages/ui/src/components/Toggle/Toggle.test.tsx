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

  it('describes the switch and can put the text first', () => {
    render(
      <Toggle
        label="Auto-add uploads"
        description="Add new uploads to the rotation"
        showLabel
        labelPosition="start"
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Auto-add uploads' });
    expect(toggle).toHaveAccessibleDescription(
      'Add new uploads to the rotation',
    );
    expect(
      screen.getByText('Auto-add uploads').compareDocumentPosition(toggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
