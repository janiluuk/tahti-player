import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { HiddenFileInput } from './HiddenFileInput';

describe('HiddenFileInput', () => {
  it('passes the chosen files and resets the input', () => {
    const onFiles = vi.fn();
    const ref = createRef<HTMLInputElement>();
    render(
      <HiddenFileInput ref={ref} accept="image/*" multiple onFiles={onFiles} />,
    );
    const input = screen.getByTestId('hidden-file-input') as HTMLInputElement;
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input.tabIndex).toBe(-1);

    const file = new File(['x'], 'cover.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('ignores an empty selection', () => {
    const onFiles = vi.fn();
    render(<HiddenFileInput onFiles={onFiles} />);
    fireEvent.change(screen.getByTestId('hidden-file-input'), {
      target: { files: [] },
    });
    expect(onFiles).not.toHaveBeenCalled();
  });
});
