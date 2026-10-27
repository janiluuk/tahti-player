import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/account-credentials';
import { ChangePasswordForm } from './ChangePasswordForm';

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('ChangePasswordForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says what a new password is missing and keeps Change disabled', () => {
    render(<ChangePasswordForm />);
    fill('Current password', 'old-one');
    fill('New password', 'alllowercase1');
    expect(screen.getByText('Add an uppercase letter.')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Change password',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('changes the password and clears the form', async () => {
    const change = vi
      .spyOn(api, 'changePassword')
      .mockResolvedValue({ ok: true, message: 'Password changed.' });
    render(<ChangePasswordForm />);
    fill('Current password', 'old-one');
    fill('New password', 'NewPassword123');
    fill('Confirm new password', 'NewPassword123');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    });
    expect(change).toHaveBeenCalledWith('old-one', 'NewPassword123');
    expect(screen.getByRole('status').textContent).toContain(
      'Password changed.',
    );
    expect(
      (screen.getByLabelText('Current password') as HTMLInputElement).value,
    ).toBe('');
  });

  it('shows the API refusal', async () => {
    vi.spyOn(api, 'changePassword').mockResolvedValue({
      ok: false,
      error: 'Current password is wrong',
    });
    render(<ChangePasswordForm />);
    fill('Current password', 'bad');
    fill('New password', 'NewPassword123');
    fill('Confirm new password', 'NewPassword123');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    });
    expect(screen.getByText('Current password is wrong')).toBeTruthy();
  });
});
