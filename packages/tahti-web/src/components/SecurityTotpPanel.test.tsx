import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SecurityTotpPanel } from './SecurityTotpPanel';

const security = vi.hoisted(() => ({
  confirmTotp: vi.fn(),
  disableTotp: vi.fn(),
  fetchTotpStatus: vi.fn(),
  setupTotp: vi.fn(),
}));

vi.mock('../api/security', () => security);

describe('SecurityTotpPanel', () => {
  beforeEach(() => {
    security.confirmTotp.mockReset();
    security.disableTotp.mockReset();
    security.fetchTotpStatus.mockReset();
    security.setupTotp.mockReset();
    security.fetchTotpStatus.mockResolvedValue({
      data: { enabled: false },
      meta: { source: 'api' },
    });
    security.setupTotp.mockResolvedValue({
      ok: true,
      secret: 'ABCDEFGHIJKLMNOP',
      otpauthUri:
        'otpauth://totp/Tahti:test@example.com?secret=ABCDEFGHIJKLMNOP&issuer=Tahti',
    });
    security.confirmTotp.mockResolvedValue({
      ok: true,
      backupCodes: ['ABCD-1111', 'EFGH-2222'],
    });
  });

  it('enrolls an authenticator app with a QR code and reveals backup codes', async () => {
    render(<SecurityTotpPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Enable 2FA' }));
    expect(
      await screen.findByLabelText('Authenticator setup QR code'),
    ).toBeVisible();
    expect(screen.getByText('ABCD EFGH IJKL MNOP')).toBeVisible();

    fireEvent.change(screen.getByLabelText('Confirmation code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('Save these backup codes')).toBeVisible();
    expect(screen.getByText('ABCD-1111')).toBeVisible();
    expect(security.confirmTotp).toHaveBeenCalledWith('123456');
  });

  it('shows a retry state when status loading fails', async () => {
    security.fetchTotpStatus
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce({
        data: { enabled: true },
        meta: { source: 'api' },
      });
    render(<SecurityTotpPanel />);

    expect(
      await screen.findByText('Could not load two-factor authentication'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByText('Enabled')).toBeVisible());
    expect(security.fetchTotpStatus).toHaveBeenCalledTimes(2);
  });
});
