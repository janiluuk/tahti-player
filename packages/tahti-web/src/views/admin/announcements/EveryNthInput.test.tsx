// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EveryNthInput } from './EveryNthInput';

describe('EveryNthInput', () => {
  it('saves once, on blur, instead of on every keystroke', () => {
    const onCommit = vi.fn();
    render(<EveryNthInput value={4} onCommit={onCommit} />);
    const field = screen.getByLabelText('Every Nth');
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.change(field, { target: { value: '1' } });
    fireEvent.change(field, { target: { value: '12' } });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(12);
  });

  it('drops a value outside 2–100 and shows the saved one again', () => {
    const onCommit = vi.fn();
    render(<EveryNthInput value={4} onCommit={onCommit} />);
    const field = screen.getByLabelText('Every Nth');
    fireEvent.change(field, { target: { value: '0' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onCommit).not.toHaveBeenCalled();
    expect(field).toHaveValue(4);
  });
});
