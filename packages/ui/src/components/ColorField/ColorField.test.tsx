import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColorField } from './ColorField';

describe('ColorField', () => {
  it('names the swatch and shows the value', () => {
    render(<ColorField label="Accent" value="#22d3ee" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Accent')).toHaveValue('#22d3ee');
    expect(screen.getByText('#22d3ee')).toBeInTheDocument();
  });

  it('reports the picked colour', () => {
    const onChange = vi.fn();
    render(<ColorField label="Accent" value="#22d3ee" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Accent'), {
      target: { value: '#ff0000' },
    });
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('keeps actions outside the label', () => {
    render(
      <ColorField
        label="Text color"
        value="#ffffff"
        onChange={vi.fn()}
        actions={<button type="button">Reset</button>}
      />,
    );
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(reset.closest('label')).toBeNull();
  });
});
