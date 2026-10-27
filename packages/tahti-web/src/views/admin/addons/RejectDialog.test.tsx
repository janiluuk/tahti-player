import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AdminAddon } from '../../../api/admin';
import { RejectDialog } from './RejectDialog';

const addon = { id: 'a1', name: 'Lyrics' } as AdminAddon;

describe('RejectDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('says the author is notified and sends the reason', () => {
    const onConfirm = vi.fn();
    render(
      <RejectDialog
        addon={addon}
        pending={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText(/the author is notified with it/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Rejection reason'), {
      target: { value: ' Reads the clipboard ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onConfirm).toHaveBeenCalledWith('Reads the clipboard');
  });
});
