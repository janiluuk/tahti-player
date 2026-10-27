import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/account-credentials';
import { ChangeEmailForm } from './ChangeEmailForm';

describe('ChangeEmailForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sends the confirmation link and says where it went', async () => {
    const request = vi.spyOn(api, 'requestEmailChange').mockResolvedValue({
      ok: true,
      message: 'We sent a link to new@example.com.',
    });
    render(<ChangeEmailForm currentEmail="old@example.com" />);
    expect(screen.getByText(/Now: old@example.com/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('New email'), {
      target: { value: ' new@example.com ' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Send confirmation link' }),
      );
    });
    expect(request).toHaveBeenCalledWith('new@example.com', 'secret');
    expect(screen.getByRole('status').textContent).toBe(
      'We sent a link to new@example.com.',
    );
  });

  it('shows the API refusal', async () => {
    vi.spyOn(api, 'requestEmailChange').mockResolvedValue({
      ok: false,
      error: 'Another account uses that address',
    });
    render(<ChangeEmailForm currentEmail={null} />);
    fireEvent.change(screen.getByLabelText('New email'), {
      target: { value: 'taken@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Send confirmation link' }),
      );
    });
    expect(screen.getByText('Another account uses that address')).toBeTruthy();
  });
});
