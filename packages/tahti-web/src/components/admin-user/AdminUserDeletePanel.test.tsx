// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminUserDeletePanel } from './AdminUserDeletePanel';

const USER = {
  id: 'u3',
  username: 'listener-one',
  displayName: 'Listener One',
  isBoard: false,
};

describe('AdminUserDeletePanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('will not delete a board member or your own account', () => {
    const { rerender } = render(
      <AdminUserDeletePanel user={{ ...USER, isBoard: true }} isSelf={false} />,
    );
    expect(screen.getByText(/Remove the board role/)).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Delete account…',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    rerender(<AdminUserDeletePanel user={USER} isSelf />);
    expect(screen.getByText(/your own account/)).toBeTruthy();
  });

  it('deletes only after the username is typed, and reports what was cancelled', async () => {
    const remove = vi.spyOn(admin, 'deleteAdminUserAccount').mockResolvedValue({
      ok: true,
      data: {
        userId: 'u3',
        fanSubscriptionsCanceled: 2,
        newsletterSubscribersRemoved: 1,
      },
    });
    const onDeleted = vi.fn();
    render(
      <AdminUserDeletePanel user={USER} isSelf={false} onDeleted={onDeleted} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));

    const confirm = screen.getByRole('button', {
      name: 'Delete account',
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Username to confirm'), {
      target: { value: 'listener-on' },
    });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Username to confirm'), {
      target: { value: 'listener-one' },
    });
    expect(confirm.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(remove).toHaveBeenCalledWith('u3');
    expect(onDeleted).toHaveBeenCalled();
    expect(
      await screen.findByText(/2 fan subscriptions cancelled/),
    ).toBeTruthy();
  });

  it('keeps the dialog open with the API refusal', async () => {
    vi.spyOn(admin, 'deleteAdminUserAccount').mockResolvedValue({
      ok: false,
      error: 'Account already deleted',
    });
    render(<AdminUserDeletePanel user={USER} isSelf={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete account…' }));
    fireEvent.change(screen.getByLabelText('Username to confirm'), {
      target: { value: 'listener-one' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'Account already deleted',
    );
  });
});
