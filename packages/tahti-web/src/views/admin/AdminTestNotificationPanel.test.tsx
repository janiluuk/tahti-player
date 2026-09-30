// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminTestNotificationPanel } from './AdminTestNotificationPanel';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('AdminTestNotificationPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('needs a username and a title before sending', () => {
    render(<AdminTestNotificationPanel />);
    const send = screen.getByRole('button', { name: /Send test/ });
    expect(send).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '@aino' },
    });
    expect(send).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Hello' },
    });
    expect(send).toHaveProperty('disabled', false);
  });

  it('sends the notification to the member without the @', async () => {
    const sendSpy = vi
      .spyOn(admin, 'sendAdminTestNotification')
      .mockResolvedValue({ ok: true });
    render(<AdminTestNotificationPanel />);
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '@aino' },
    });
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Hello' },
    });
    fireEvent.change(screen.getByLabelText('Message (optional)'), {
      target: { value: 'Testing' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send test/ }));
    await vi.waitFor(() =>
      expect(sendSpy).toHaveBeenCalledWith({
        targetUsername: 'aino',
        title: 'Hello',
        body: 'Testing',
        url: undefined,
      }),
    );
    await vi.waitFor(() =>
      expect(screen.getByLabelText('Title')).toHaveProperty('value', ''),
    );
  });
});
