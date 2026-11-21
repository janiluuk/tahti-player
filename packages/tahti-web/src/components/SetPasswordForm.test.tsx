import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/account-credentials';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { SetPasswordForm } from './SetPasswordForm';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const socialUser = {
  id: 'u1',
  email: 'liina@gmail.com',
  username: 'liina',
  displayName: 'Liina',
  hasPassword: false,
} as AuthUser;

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submitButton() {
  return screen.getByRole('button', {
    name: 'Set password',
  }) as HTMLButtonElement;
}

async function submitValid() {
  fill('New password', 'NewPassword123');
  fill('Confirm new password', 'NewPassword123');
  await act(async () => {
    fireEvent.click(submitButton());
  });
}

describe('SetPasswordForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: socialUser, refresh: vi.fn(async () => {}) });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('checks the password rules and the confirmation', () => {
    render(<SetPasswordForm />);
    expect(screen.queryByLabelText('Current password')).toBeNull();
    fill('New password', 'alllowercase1');
    expect(screen.getByText('Add an uppercase letter.')).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
    fill('New password', 'NewPassword123');
    fill('Confirm new password', 'NewPassword124');
    expect(screen.getByText("Passwords don't match.")).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it('sets the password, refreshes the session and toasts', async () => {
    const set = vi.spyOn(api, 'setFirstPassword').mockResolvedValue({
      ok: true,
    });
    const refresh = vi.fn(async () => {
      useAuthStore.setState({ user: { ...socialUser, hasPassword: true } });
    });
    useAuthStore.setState({ refresh });
    render(<SetPasswordForm />);
    await submitValid();
    expect(set).toHaveBeenCalledWith('NewPassword123');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.hasPassword).toBe(true);
    expect(toast.success).toHaveBeenCalledWith(
      'Password set. You can now also sign in with your email.',
    );
  });

  it('treats 409 as already set: refreshes, no toast, no error', async () => {
    vi.spyOn(api, 'setFirstPassword').mockResolvedValue({
      ok: false,
      alreadySet: true,
      error: 'Password already set',
    });
    render(<SetPasswordForm />);
    await submitValid();
    expect(useAuthStore.getState().refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.hasPassword).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.queryByText('Password already set')).toBeNull();
  });

  it('shows a 400 refusal inline', async () => {
    vi.spyOn(api, 'setFirstPassword').mockResolvedValue({
      ok: false,
      alreadySet: false,
      error: 'Password is too common',
    });
    render(<SetPasswordForm />);
    await submitValid();
    expect(screen.getByText('Password is too common')).toBeTruthy();
    expect(useAuthStore.getState().refresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.hasPassword).toBe(false);
    expect(submitButton().disabled).toBe(false);
  });
});
