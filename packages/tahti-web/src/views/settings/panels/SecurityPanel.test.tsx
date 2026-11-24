import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as security from '../../../api/security';
import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { SecurityPanel } from './SecurityPanel';

vi.mock('../../../components/ChangeEmailForm', () => ({
  ChangeEmailForm: ({ currentEmail }: { currentEmail: string | null }) => (
    <p>change email form for {currentEmail}</p>
  ),
}));
vi.mock('../../../components/LinkedLoginsSection', () => ({
  LinkedLoginsSection: () => null,
}));

const user = {
  id: 'u1',
  email: 'liina@gmail.com',
  username: 'liina',
  displayName: 'Liina',
} as AuthUser;

function mockTotp(enabled: boolean) {
  vi.spyOn(security, 'fetchTotpStatus').mockResolvedValue({
    data: { enabled },
    meta: { source: 'api' },
  });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  mockTotp(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SecurityPanel password row', () => {
  it('opens Set a password in a dialog when the account has none', () => {
    useAuthStore.setState({ user: { ...user, hasPassword: false } });
    render(<SecurityPanel />);

    expect(screen.queryByLabelText('New password')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Set password' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Current password')).toBeNull();
  });

  it.each([
    ['has a password', true],
    ['predates hasPassword', undefined],
  ])(
    'opens the change form in a dialog when the account %s',
    (_label, hasPassword) => {
      useAuthStore.setState({ user: { ...user, hasPassword } });
      render(<SecurityPanel />);

      expect(screen.queryByLabelText('Current password')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Change password' }));

      expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    },
  );
});

describe('SecurityPanel email row', () => {
  it('shows the current address and opens the change form in a dialog', () => {
    useAuthStore.setState({ user: { ...user, hasPassword: true } });
    render(<SecurityPanel />);

    expect(screen.getByText('liina@gmail.com')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change email' }));

    expect(
      screen.getByText('change email form for liina@gmail.com'),
    ).toBeInTheDocument();
  });
});

describe('SecurityPanel two-factor', () => {
  it('recommends turning 2FA on while it is off', async () => {
    mockTotp(false);
    useAuthStore.setState({ user: { ...user, hasPassword: true } });
    vi.spyOn(security, 'setupTotp').mockResolvedValue({
      ok: true,
      secret: 'ABCDEFGHIJKLMNOP',
      otpauthUri: 'otpauth://totp/Tahti:liina?secret=ABCDEFGHIJKLMNOP',
    });
    render(<SecurityPanel />);

    const banner = await screen.findByTestId('security-2fa-banner');
    expect(banner).toHaveTextContent('Add a second lock to your account');
    const section = screen.getByTestId('security-2fa');
    expect(section).toContainElement(banner);
    expect(screen.getByTestId('security-2fa-status')).toHaveTextContent(
      'Disabled',
    );
    expect(screen.getAllByText('Two-factor authentication')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Turn on two-factor' }));
    expect(
      await screen.findByLabelText('Authenticator setup QR code'),
    ).toBeVisible();
    expect(screen.getByTestId('security-2fa-banner')).toBeVisible();
  });

  it('shows 2FA on the main page without a banner once it is on', async () => {
    useAuthStore.setState({ user: { ...user, hasPassword: true } });
    render(<SecurityPanel />);

    await waitFor(() => expect(security.fetchTotpStatus).toHaveBeenCalled());
    expect(
      await screen.findAllByText('Two-factor authentication'),
    ).not.toHaveLength(0);
    expect(screen.queryByTestId('security-2fa-banner')).toBeNull();
    expect(await screen.findByTestId('security-2fa-status')).toHaveTextContent(
      'Enabled',
    );
    expect(
      screen.queryByRole('tab', { name: /Two-factor authentication/ }),
    ).toBeNull();
  });
});
